import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
};

/**
 * Enriches seed listings from each business's own website: pulls a description
 * (summary + longer text), a cover image, and a logo, so imported pages are as
 * complete as the ones businesses fill in themselves. Only fills EMPTY fields —
 * never overwrites info a business has added. Batched + time-budgeted; the
 * button loops it until done. Admin-only.
 */
export async function POST() {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }
  const supabase = createSupabaseServiceRoleClient();

  const { data } = await supabase
    .from("services")
    .select("id, slug, website_url, logo_url, cover_image_url, summary, description")
    .not("website_url", "is", null)
    .is("seller_id", null)
    .order("created_at", { ascending: false })
    .limit(400);

  type Row = {
    id: string; slug: string; website_url: string | null;
    logo_url: string | null; cover_image_url: string | null;
    summary: string | null; description: string | null;
  };
  // Only sites we haven't already fully enriched (missing text OR missing a stored logo).
  const targets = ((data ?? []) as Row[]).filter(
    (r) => !!r.website_url && (!r.summary || !r.description || !(r.logo_url ?? "").includes("/storage/v1/object/")),
  );

  let enriched = 0;
  const failed: string[] = [];
  const started = Date.now();
  let processed = 0;

  for (const r of targets) {
    if (Date.now() - started > 50_000) break;
    processed += 1;
    const site = normalizeUrl(r.website_url as string);
    const info = await readSite(site);
    if (!info) {
      failed.push(r.slug);
      continue;
    }

    const update: Record<string, unknown> = {};
    // Text — only fill what's empty.
    const desc = info.description?.trim();
    if (!r.summary && desc) update.summary = desc.slice(0, 280);
    if (!r.description && desc) update.description = desc.slice(0, 2000);

    // Logo — only if we don't already have one in our storage.
    if (!(r.logo_url ?? "").includes("/storage/v1/object/") && info.logoBytes) {
      const url = await store(supabase, r.slug, "logo", info.logoBytes);
      if (url) update.logo_url = url;
    }
    // Cover — a wide hero image, if the listing has none distinct from the logo.
    const hasCover = !!r.cover_image_url && r.cover_image_url !== r.logo_url;
    if (!hasCover && info.coverBytes) {
      const url = await store(supabase, r.slug, "cover", info.coverBytes);
      if (url) update.cover_image_url = url;
    }

    if (Object.keys(update).length) {
      await supabase.from("services").update(update).eq("id", r.id);
      enriched += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    updated: enriched,
    failed: failed.length,
    remaining: Math.max(0, targets.length - processed),
    totalTargets: targets.length,
  });
}

function normalizeUrl(v: string): string {
  const t = v.trim();
  return /^https?:\/\//i.test(t) ? t : `https://${t.replace(/^\/+/, "")}`;
}

async function store(
  supabase: ReturnType<typeof createSupabaseServiceRoleClient>,
  slug: string,
  kind: string,
  bytes: { buffer: Buffer; contentType: string },
): Promise<string | null> {
  const ext = EXT[bytes.contentType] ?? "png";
  const path = `${kind}s/${slug}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("service-media").upload(path, bytes.buffer, {
    contentType: bytes.contentType,
    upsert: true,
  });
  if (error) return null;
  return supabase.storage.from("service-media").getPublicUrl(path).data.publicUrl;
}

type SiteInfo = {
  description: string | null;
  logoBytes: { buffer: Buffer; contentType: string } | null;
  coverBytes: { buffer: Buffer; contentType: string } | null;
};

async function readSite(site: string): Promise<SiteInfo | null> {
  let origin = "";
  let host = "";
  try {
    const u = new URL(site);
    origin = u.origin;
    host = u.hostname;
  } catch {
    return null;
  }

  const html = (await fetchText(site)) ?? "";
  const head = html.slice(0, 300_000);

  const description =
    meta(head, "property", "og:description") || meta(head, "name", "description") || meta(head, "name", "twitter:description") || null;

  // Logo candidates, best first: an <img> that looks like a logo, then icons.
  const logoCandidates: string[] = [];
  const logoImg = head.match(/<img[^>]+(?:class|id|alt|src)=["'][^"']*logo[^"']*["'][^>]*>/i);
  if (logoImg) {
    const src = attr(logoImg[0], "src");
    if (src) logoCandidates.push(abs(src, origin, site));
  }
  for (const m of head.matchAll(/<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]*>/gi)) {
    const href = attr(m[0], "href");
    if (href) logoCandidates.push(abs(href, origin, site));
  }
  for (const m of head.matchAll(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*>/gi)) {
    const href = attr(m[0], "href");
    if (href) logoCandidates.push(abs(href, origin, site));
  }
  logoCandidates.push(`${origin}/apple-touch-icon.png`);
  if (host) logoCandidates.push(`https://www.google.com/s2/favicons?domain=${host}&sz=128`);

  // Cover: the big social-share image.
  const ogImage = meta(head, "property", "og:image") || meta(head, "name", "twitter:image");
  const coverUrl = ogImage ? abs(ogImage, origin, site) : null;

  const logoBytes = await firstImage(logoCandidates);
  const coverBytes = coverUrl ? await fetchImage(coverUrl) : null;

  return { description, logoBytes, coverBytes };
}

function meta(html: string, kind: "name" | "property", key: string): string | null {
  const re = new RegExp(`<meta[^>]+${kind}=["']${key}["'][^>]*>`, "i");
  const tag = html.match(re);
  if (!tag) return null;
  const c = attr(tag[0], "content");
  return c ? decodeEntities(c).trim() : null;
}
function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`${name}=["']([^"']+)["']`, "i"));
  return m ? m[1] : null;
}
function abs(href: string, origin: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href.startsWith("//") ? `https:${href}` : `${origin}${href.startsWith("/") ? "" : "/"}${href}`;
  }
}
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'").replace(/&nbsp;/g, " ");
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 7000);
    const res = await fetch(url, { redirect: "follow", signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (compatible; PlisticBot/1.0)" } });
    clearTimeout(t);
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}
async function firstImage(urls: string[]): Promise<{ buffer: Buffer; contentType: string } | null> {
  for (const url of urls) {
    const img = await fetchImage(url);
    if (img) return img;
  }
  return null;
}
async function fetchImage(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 7000);
    const res = await fetch(url, { redirect: "follow", signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (compatible; PlisticBot/1.0)" } });
    clearTimeout(t);
    const ct = (res.headers.get("content-type") ?? "").toLowerCase().split(";")[0].trim();
    if (res.ok && ct.startsWith("image/")) {
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.byteLength > 200 && buffer.byteLength < 10 * 1024 * 1024) return { buffer, contentType: ct };
    }
  } catch {
    /* ignore */
  }
  return null;
}
