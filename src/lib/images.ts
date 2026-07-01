/**
 * Whether a stored URL is something a browser can actually render in <img>.
 * Google Form file uploads are saved as Google Drive/Docs *share* links, which
 * return an HTML page (not the image), so they must not be used as an <img src>.
 */
export function isDisplayableImage(url: string | null | undefined): url is string {
  if (!url) return false;
  const u = url.trim();
  if (!/^https?:\/\//i.test(u)) return false;
  if (/drive\.google\.|docs\.google\.|\/open\?|[?&]id=/i.test(u)) return false;
  return true;
}

/** First letter for a fallback avatar/placeholder tile. */
export function initialOf(name: string): string {
  const c = name.trim().charAt(0).toUpperCase();
  return /[A-Z0-9]/.test(c) ? c : "•";
}
