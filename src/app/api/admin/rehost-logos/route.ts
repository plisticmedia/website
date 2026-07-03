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
};

/**
 * Pulls Google Drive-hosted logos into our own storage so they render reliably
 * (Drive blocks hot-linking). Admin-only. Files that Google won't serve are
 * skipped and reported; those need a manual upload (or the business uploads its
 * own when it claims the listing).
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
    .limit(300);

  type Row = { id: string; slug: string; logo_url: string | null; cover_image_url: string | null };
  const rows = ((data ?? []) as Row[]).filter((r) => isDriveUrl(r.logo_url) || isDriveUrl(r.cover_image_url));

  let rehosted = 0;
  const failed: string[] = [];

  for (const r of rows) {
    const src = isDriveUrl(r.logo_url) ? r.logo_url! : r.cover_image_url!;
    const id = extractDriveId(src);
    if (!id) {
      failed.push(r.slug);
      continue;
    }
    const bytes = await fetchDriveImage(id);
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

  return NextResponse.json({ ok: true, rehosted, failed: failed.length, failedSlugs: failed });
}

/** Try Drive's download + thumbnail endpoints; return image bytes or null. */
async function fetchDriveImage(id: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  const urls = [
    `https://drive.google.com/uc?export=download&id=${id}`,
    `https://drive.google.com/thumbnail?id=${id}&sz=w1000`,
    `https://lh3.googleusercontent.com/d/${id}=w1000`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      const ct = (res.headers.get("content-type") ?? "").toLowerCase();
      if (res.ok && ct.startsWith("image/")) {
        const buffer = Buffer.from(await res.arrayBuffer());
        if (buffer.byteLength > 0) return { buffer, contentType: ct.split(";")[0] };
      }
    } catch {
      /* try the next endpoint */
    }
  }
  return null;
}
