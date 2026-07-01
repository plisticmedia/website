// Thin wrapper around the Google Places API (New) for fetching business
// ratings. All calls no-op (return null) when GOOGLE_PLACES_API_KEY is unset,
// so the feature stays dormant until a key is added — no errors, no crashes.

export type PlaceResult = {
  placeId: string;
  rating: number | null;
  ratingCount: number | null;
  name: string | null;
};

const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

export function googlePlacesConfigured(): boolean {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY);
}

/** Resolves a business to a Google place by name/address, returning its id + rating. */
export async function findPlace(query: string): Promise<PlaceResult | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key || !query.trim()) return null;

  try {
    const res = await fetch(SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.id,places.rating,places.userRatingCount,places.displayName",
      },
      body: JSON.stringify({ textQuery: query, regionCode: "GB", maxResultCount: 1 }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { places?: Array<Record<string, unknown>> };
    const place = data.places?.[0];
    if (!place || typeof place.id !== "string") return null;
    const displayName = place.displayName as { text?: string } | undefined;
    return {
      placeId: place.id,
      rating: typeof place.rating === "number" ? place.rating : null,
      ratingCount: typeof place.userRatingCount === "number" ? place.userRatingCount : null,
      name: typeof displayName?.text === "string" ? displayName.text : null,
    };
  } catch {
    return null;
  }
}

/** Refreshes rating + review count for a known place id. */
export async function getPlaceRating(placeId: string): Promise<PlaceResult | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key || !placeId) return null;

  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "id,rating,userRatingCount",
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    if (typeof data.id !== "string") return null;
    return {
      placeId: data.id,
      rating: typeof data.rating === "number" ? data.rating : null,
      ratingCount: typeof data.userRatingCount === "number" ? data.userRatingCount : null,
      name: null,
    };
  } catch {
    return null;
  }
}
