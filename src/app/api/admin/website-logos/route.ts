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
 * Sources a logo for listings that don't have one by reading each business's
 * website (apple-touch-icon → og:image → icon → Google's favicon service) and
 * saving the best image to our storage. Best-effort, batched + time-budgeted so
 * it stays under the function limit; the button loops it until done. Admin-only.
 */
export async function POST() {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }
  const supabase = createSupabaseServiceRoleClient();

  // Listings with a website but no logo saved in OUR storage yet.
  const { data } = await supabase
    .from("services")
    .select("id, slug, website_url, logo_url")
    .not("website_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(400);

  type Row = { id: string; slug: string; website_url: string | null; logo_url: string | null };
  const targets = ((data ?? []) as Row[]).filter(
    (r) => !!r.website_url && !(r.logo_url ?? "").includes("/storage/v1/object/"),
  );

  let updated = 0;
  const failed: string[] = [];
  const started = Date.now();
  let processed = 0;

  for (const r of targets) {
    if (Date.now() - started > 50_000) break;
    processed += 1;
    const site = normalizeUrl(r.website_url as string);
    const bytes = await logoForSite(site);
    if (!bytes) {
      failed.push(r.slug);
      continue;
    }
    const ext = EXT[bytes.contentType] ?? "png";
    const path = `logos/${r.slug}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("service-media")
      .upload(path, bytes.buffer, { contentType: bytes.contentType, upsert: true });
    if (upErr) {
      failed.push(r.slug);
      continue;
    }
    const url = supabase.storage.from("service-media").getPublicUrl(path).data.publicUrl;
    await supabase.from("services").update({ logo_url: url, cover_image_url: url }).eq("id", r.id);
    updated += 1;
  }

  return NextResponse.json({
    ok: true,
    updated,
    failed: failed.length,
    failedSlugs: failed.slice(0, 20),
    remaining: Math.max(0, targets.length - processed),
    totalTargets: targets.length,
  });
}

function normalizeUrl(v: string): string {
  const t = v.trim();
  return /^https?:\/\//i.test(t) ? t : `https://${t.replace(/^\/+/, "")}`;
}

/** Fetch a site and return the best available logo image bytes. */
async function logoForSite(site: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  let origin = "";
  let host = "";
  try {
    const u = new URL(site);
    origin = u.origin;
    host = u.hostname;
  } catch {
    return null;
  }

  const candidates: string[] = [];
  try {
    const html = await fetchText(site);
    if (html) {
      const head = html.slice(0, 200_000);
      // apple-touch-icon (usually a clean square logo)
      for (const m of head.matchAll(/<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]*>/gi)) {
        const href = attr(m[0], "href");
        if (href) candidates.push(abs(href, origin, site));
      }
      // og:image (often a branded image)
      for (const m of head.matchAll(/<meta[^>]+property=["']og:image["'][^>]*>/gi)) {
        const c = attr(m[0], "content");
        if (c) candidates.push(abs(c, origin, site));
      }
      // any declared icon
      for (const m of head.matchAll(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*>/gi)) {
        const href = attr(m[0], "href");
        if (href) candidates.push(abs(href, origin, site));
      }
    }
  } catch {
    /* fall through to favicon services */
  }

  // Reliable fallbacks that (almost) always return something.
  candidates.push(`${origin}/apple-touch-icon.png`);
  if (host) candidates.push(`https://www.google.com/s2/favicons?domain=${host}&sz=128`);

  for (const url of candidates) {
    const bytes = await fetchImage(url);
    if (bytes) return bytes;
  }
  return null;
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

async function fetchText(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 7000);
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PlisticBot/1.0)" },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function fetchImage(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 7000);
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PlisticBot/1.0)" },
    });
    clearTimeout(t);
    const ct = (res.headers.get("content-type") ?? "").toLowerCase().split(";")[0].trim();
    if (res.ok && ct.startsWith("image/")) {
      const buffer = Buffer.from(await res.arrayBuffer());
      // Ignore 1x1 tracking pixels / empties; cap size.
      if (buffer.byteLength > 200 && buffer.byteLength < 10 * 1024 * 1024) {
        return { buffer, contentType: ct };
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}
