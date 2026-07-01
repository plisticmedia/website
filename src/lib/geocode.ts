/**
 * Free geocoding via OpenStreetMap Nominatim (no API key).
 * Usage policy: ≤1 request/second and a descriptive User-Agent — callers that
 * geocode many rows must throttle. Runs server-side only.
 */
export type LatLng = { lat: number; lng: number };

// Values that aren't a single geographic point — skip for map pins.
const LOCATION_STOPWORDS = new Set([
  "remote", "scotlandwide", "ukwide", "nationwide", "online", "everywhere",
  "various", "anywhere", "na", "hybrid", "flexible",
]);

/** From a possibly-messy location ("Glasgow, Ayrshire, London") pick the first real place. */
export function cleanLocation(location: string | null | undefined): string | null {
  if (!location) return null;
  const parts = location.split(/[,/&]|\band\b/i).map((s) => s.trim()).filter(Boolean);
  for (const p of parts) {
    const key = p.toLowerCase().replace(/[^a-z]/g, "");
    if (key && !LOCATION_STOPWORDS.has(key)) return p;
  }
  return null;
}

export function geocodeQuery(parts: {
  address?: string | null;
  postcode?: string | null;
  location?: string | null;
}): string {
  const pieces = [parts.address, parts.postcode, cleanLocation(parts.location)]
    .map((p) => (p ?? "").trim())
    .filter(Boolean);
  if (pieces.length === 0) return "";
  return [...pieces, "Scotland"].join(", ");
}

export async function geocode(query: string): Promise<LatLng | null> {
  if (!query.trim()) return null;
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=gb&q=" +
    encodeURIComponent(query);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "PlisticDirectory/1.0 (hello@plisticmedia.com)" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (Array.isArray(data) && data[0]) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
    return null;
  } catch {
    return null;
  }
}
