import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { findPlace, getPlaceRating, googlePlacesConfigured } from "@/lib/googlePlaces";

export type RatingsRunResult = {
  updated: number;
  matched: number;
  processed: number;
  remaining: number;
  publishedTotal: number;
  error?: string;
};

type Row = {
  id: string;
  title: string;
  address: string | null;
  postcode: string | null;
  google_place_id: string | null;
  location_id: string | null;
};

/**
 * Refreshes Google ratings for a batch of published listings, stalest first.
 * For listings without a known place id, resolves it once from name + address;
 * thereafter refreshes by place id. Uses the service role so it works from both
 * the admin button (with a session) and the scheduled cron (no session).
 * Safe to call with no API key configured — it simply does nothing.
 */
export async function refreshRatings(limit = 20): Promise<RatingsRunResult> {
  if (!googlePlacesConfigured()) {
    return { updated: 0, matched: 0, processed: 0, remaining: 0, publishedTotal: 0 };
  }

  const supabase = createSupabaseServiceRoleClient();

  // Diagnostic: how many published listings exist at all (independent of the
  // batch query below), so the admin message can distinguish "nothing to do"
  // from "can't see the data".
  const { count: publishedTotal } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  // Stalest first (never-fetched come first as NULLs). We try to match every
  // published listing to Google by name + area, using the street address too
  // when it's available for a tighter match. No embed here (services links to
  // locations two ways) — the base location name is looked up separately.
  const { data, error } = await supabase
    .from("services")
    .select("id, title, address, postcode, google_place_id, location_id")
    .eq("status", "published")
    .order("google_rating_updated_at", { ascending: true, nullsFirst: true })
    .limit(limit);

  if (error) {
    return { updated: 0, matched: 0, processed: 0, remaining: 0, publishedTotal: publishedTotal ?? 0, error: error.message };
  }

  const rows = (data ?? []) as unknown as Row[];

  // Resolve base-location names for the batch in one query.
  const locIds = [...new Set(rows.map((r) => r.location_id).filter((v): v is string => !!v))];
  const locNames = new Map<string, string>();
  if (locIds.length > 0) {
    const { data: locs } = await supabase.from("locations").select("id, name").in("id", locIds);
    for (const l of (locs ?? []) as Array<{ id: string; name: string }>) locNames.set(l.id, l.name);
  }

  let updated = 0;
  let matched = 0;
  for (const row of rows) {
    // "SKIP" = admin cleared this listing's match; leave it alone.
    if (row.google_place_id === "SKIP") continue;

    const locationName = row.location_id ? locNames.get(row.location_id) ?? null : null;
    let place = row.google_place_id
      ? await getPlaceRating(row.google_place_id)
      : await findPlace(buildQuery(row, locationName));

    // For a fresh name search (no stored place id), only trust the match when
    // the returned Google name overlaps the listing name — guards against
    // attaching an unrelated business's rating.
    if (place && !row.google_place_id && !namesOverlap(row.title, place.name)) {
      place = null;
    }

    if (place) {
      matched += 1;
      await supabase
        .from("services")
        .update({
          google_place_id: place.placeId,
          google_rating: place.rating,
          google_rating_count: place.ratingCount,
          google_rating_updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (place.rating != null) updated += 1;
    } else {
      // Stamp the timestamp so a stubborn no-match doesn't block the queue.
      await supabase
        .from("services")
        .update({ google_rating_updated_at: new Date().toISOString() })
        .eq("id", row.id);
    }

    await new Promise((res) => setTimeout(res, 200));
  }

  const { count } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .is("google_rating_updated_at", null);

  return { updated, matched, processed: rows.length, remaining: count ?? 0, publishedTotal: publishedTotal ?? 0 };
}

function buildQuery(row: Row, locationName: string | null): string {
  return [row.title, row.address, row.postcode, locationName, "Scotland"]
    .filter(Boolean)
    .join(", ");
}

const NAME_STOPWORDS = new Set(["the", "ltd", "limited", "llp", "and", "co", "company", "uk", "scotland"]);

/** Loose check that two business names refer to the same place: they share a
 *  meaningful word. Tolerant enough for "Ltd"/punctuation differences. */
function namesOverlap(a: string, b: string | null): boolean {
  if (!b) return false;
  const tokens = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length >= 3 && !NAME_STOPWORDS.has(t)),
    );
  const ta = tokens(a);
  const tb = tokens(b);
  for (const t of ta) if (tb.has(t)) return true;
  return false;
}
