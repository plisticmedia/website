import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { findPlace, getPlaceRating, googlePlacesConfigured } from "@/lib/googlePlaces";

export type RatingsRunResult = {
  updated: number;
  matched: number;
  processed: number;
  remaining: number;
};

type Row = {
  id: string;
  title: string;
  address: string | null;
  postcode: string | null;
  google_place_id: string | null;
  locations: { name: string } | null;
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
    return { updated: 0, matched: 0, processed: 0, remaining: 0 };
  }

  const supabase = createSupabaseServiceRoleClient();

  // Stalest first (never-fetched come first as NULLs), and only listings we can
  // actually resolve: those with a place id already, or an address to search by.
  const { data } = await supabase
    .from("services")
    .select("id, title, address, postcode, google_place_id, locations(name)")
    .eq("status", "published")
    .or("google_place_id.not.is.null,address.not.is.null,postcode.not.is.null")
    .order("google_rating_updated_at", { ascending: true, nullsFirst: true })
    .limit(limit);

  const rows = (data ?? []) as unknown as Row[];

  let updated = 0;
  let matched = 0;
  for (const row of rows) {
    const place = row.google_place_id
      ? await getPlaceRating(row.google_place_id)
      : await findPlace(buildQuery(row));

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
    .is("google_rating_updated_at", null)
    .or("google_place_id.not.is.null,address.not.is.null,postcode.not.is.null");

  return { updated, matched, processed: rows.length, remaining: count ?? 0 };
}

function buildQuery(row: Row): string {
  return [row.title, row.address, row.postcode, row.locations?.name, "Scotland"]
    .filter(Boolean)
    .join(", ");
}
