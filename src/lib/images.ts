/**
 * Turns a stored image value into a URL a browser can actually render, or null.
 *
 * Google Form file uploads land in the sheet as Google Drive *share* links
 * (e.g. `https://drive.google.com/open?id=FILE_ID` or `/file/d/FILE_ID/view`),
 * which return an HTML page rather than the image. We convert those to Google's
 * direct image endpoint (`lh3.googleusercontent.com/d/FILE_ID`), which serves
 * the file itself — provided the file/folder is shared "anyone with the link".
 * A cell may hold several comma-separated links; we use the first.
 */
export function toDisplayImage(value: string | null | undefined, width = 1000): string | null {
  if (!value) return null;
  const first = value.split(/[,\s]+/).find((v) => /^https?:\/\//i.test(v));
  if (!first) return null;

  if (/drive\.google\.|docs\.google\.|googleusercontent\.com/i.test(first)) {
    const id = extractDriveId(first);
    // Drive's thumbnail endpoint is the most reliable way to hotlink a public
    // Drive image (works for Google Form uploads shared "anyone with the link").
    return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${width}` : null;
  }
  return first;
}

/** True if the URL is a Google Drive/Docs link (not directly hot-linkable). */
export function isDriveUrl(url: string | null | undefined): boolean {
  return !!url && /drive\.google\.|docs\.google\./i.test(url);
}

export function extractDriveId(url: string): string | null {
  const m =
    url.match(/\/file\/d\/([-\w]{16,})/) ||
    url.match(/[?&]id=([-\w]{16,})/) ||
    url.match(/\/d\/([-\w]{16,})/) ||
    url.match(/googleusercontent\.com\/d\/([-\w]{16,})/);
  return m ? m[1] : null;
}

/**
 * Converts a YouTube/Vimeo watch/share URL into an embeddable player URL for an
 * <iframe>. Returns null if it isn't a recognised provider.
 */
export function toEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const u = url.trim();
  const yt =
    u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/i) ||
    u.match(/youtube\.com\/shorts\/([\w-]{6,})/i);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = u.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  // Google Drive share links (…/file/d/ID/view, …/open?id=ID, …/uc?id=ID).
  // The file must be shared "anyone with the link" for the embed to play.
  const drive = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?[^]*?id=)([\w-]+)/i);
  if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;
  return null;
}

/** First letter for a fallback monogram tile. */
export function initialOf(name: string): string {
  const c = name.trim().charAt(0).toUpperCase();
  return /[A-Z0-9]/.test(c) ? c : "•";
}
