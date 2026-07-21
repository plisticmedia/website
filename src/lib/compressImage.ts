/**
 * Downscale + JPEG-compress a photo in the browser before upload, so large
 * phone photos (often 5–12 MB) upload quickly and comfortably fit the size
 * limit. Returns the original file unchanged on any failure, if it's already
 * small, or for formats we shouldn't recompress (GIF keeps animation; logos
 * pass their own format through to preserve transparency). Browser-only —
 * import from client components.
 */
export async function compressPhoto(file: File, maxDim = 2200, quality = 0.85): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  if (file.size < 500 * 1024) return file; // already small enough

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob || blob.size >= file.size) return file; // no size win — keep original

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}
