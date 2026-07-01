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

function extractDriveId(url: string): string | null {
  const m =
    url.match(/\/file\/d\/([-\w]{16,})/) ||
    url.match(/[?&]id=([-\w]{16,})/) ||
    url.match(/\/d\/([-\w]{16,})/) ||
    url.match(/googleusercontent\.com\/d\/([-\w]{16,})/);
  return m ? m[1] : null;
}

/** First letter for a fallback monogram tile. */
export function initialOf(name: string): string {
  const c = name.trim().charAt(0).toUpperCase();
  return /[A-Z0-9]/.test(c) ? c : "•";
}
