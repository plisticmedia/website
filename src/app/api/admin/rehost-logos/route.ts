import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { isDriveUrl, extractDriveId } from "@/lib/images";

export const runtime = "nodejs";
export const maxDuration = 60;

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

/** First http(s) URL from a possibly comma/space-separated cell value. */
function firstUrl(value: string | null): string | null {
  if (!value) return null;
  const m = value.split(/[\s,]+/).find((v) => /^https?:\/\//i.test(v));
  return m ?? null;
}

/** Already saved in our own storage — nothing to do. */
function isOurStorage(url: string): boolean {
  return url.includes("/storage/v1/object/");
}

/**
 * Pulls remote logos (Google Drive OR any direct image URL) into our own storage
 * so they render reliably. Admin-only. Reports what it found so a "0 imported"
 * result is diagnosable (e.g. the CSV had no logo links, or links of a kind we
 * can't fetch). Skips logos already hosted by us.
 */
export async function POST() {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }
  const supabase = createSupabaseServiceRoleClient();

  const { data } = await supabase
    .from("services")
    .select("id, slug, logo_url, cover_image_url")
    .or("logo_url.not.is.null,cover_image_url.not.is.null")
    .limit(400);

  type Row = { id: string; slug: string; logo_url: string | null; cover_image_url: string | null };
  const rows = (data ?? []) as Row[];

  let withLogo = 0;
  let alreadyHosted = 0;
  let rehosted = 0;
  const failed: string[] = [];
  const samples: string[] = [];
  const started = Date.now();

  for (const r of rows) {
    const src = firstUrl(r.logo_url) ?? firstUrl(r.cover_image_url);
    if (!src) continue;
    withLogo += 1;
    if (isOurStorage(src)) {
      alreadyHosted += 1;
      continue;
    }
    if (samples.length < 6) samples.push(src);

    // Leave a little headroom under the 60s function limit.
    if (Date.now() - started > 50_000) break;

    const bytes = isDriveUrl(src)
      ? await fetchDriveImage(extractDriveId(src) ?? "")
      : await fetchRemoteImage(src);
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
    rehosted += 1;
  }

  return NextResponse.json({
    ok: true,
    rehosted,
    failed: failed.length,
    failedSlugs: failed.slice(0, 20),
    examined: rows.length,
    withLogo,
    alreadyHosted,
    samples, // a few raw logo values so a 0 result is diagnosable
  });
}

/** Try Drive's download + thumbnail endpoints; return image bytes or null. */
async function fetchDriveImage(id: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!id) return null;
  const urls = [
    `https://drive.google.com/uc?export=download&id=${id}`,
    `https://drive.google.com/thumbnail?id=${id}&sz=w1000`,
    `https://lh3.googleusercontent.com/d/${id}=w1000`,
  ];
  return fetchFirstImage(urls);
}

/** Fetch a plain remote image URL (a business's own logo link). */
async function fetchRemoteImage(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  return fetchFirstImage([url]);
}

async function fetchFirstImage(urls: string[]): Promise<{ buffer: Buffer; contentType: string } | null> {
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; PlisticBot/1.0)" },
      });
      const ct = (res.headers.get("content-type") ?? "").toLowerCase();
      if (res.ok && ct.startsWith("image/")) {
        const buffer = Buffer.from(await res.arrayBuffer());
        if (buffer.byteLength > 0 && buffer.byteLength < 10 * 1024 * 1024) {
          return { buffer, contentType: ct.split(";")[0].trim() };
        }
      }
    } catch {
      /* try the next endpoint */
    }
  }
  return null;
}
