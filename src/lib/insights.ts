import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export type PricingPosition = {
  /** This listing's typical (lowest) package price, in GBP. */
  yourPrice: number;
  /** Median lowest-price across comparable published listings in the same category. */
  median: number;
  position: "below" | "around" | "above";
  /** How many other listings we compared against. */
  sampleSize: number;
};

export type ListingInsights = {
  views: number;
  views30d: number;
  enquiries: number;
  pricing: PricingPosition | null;
};

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Lowest positive package price for a service, or null if it has none. */
function lowestPrice(prices: Array<number | null>): number | null {
  const positive = prices.filter((p): p is number => typeof p === "number" && p > 0);
  return positive.length ? Math.min(...positive) : null;
}

/**
 * Per-listing insights for the seller: total + 30-day page views, enquiry count,
 * and where the listing's pricing sits versus comparable listings in the same
 * category. Uses the service role (read-only aggregation across listings).
 */
export async function getListingInsights(serviceId: string): Promise<ListingInsights> {
  const supabase = createSupabaseServiceRoleClient();

  const { data: svc } = await supabase
    .from("services")
    .select("id, view_count, category_id, service_packages ( price_gbp )")
    .eq("id", serviceId)
    .maybeSingle();

  const views = (svc?.view_count as number) ?? 0;
  const categoryId = (svc?.category_id as string | null) ?? null;
  const myPrices = ((svc?.service_packages ?? []) as Array<{ price_gbp: number | null }>).map((p) => p.price_gbp);
  const yourPrice = lowestPrice(myPrices);

  // Enquiries for this listing.
  const { count: enquiries } = await supabase
    .from("enquiries")
    .select("id", { count: "exact", head: true })
    .eq("service_id", serviceId);

  // 30-day views from the daily buckets (best-effort; table may be empty early on).
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data: recent } = await supabase
    .from("service_views")
    .select("count, day")
    .eq("service_id", serviceId)
    .gte("day", since);
  const views30d = ((recent ?? []) as Array<{ count: number }>).reduce((sum, r) => sum + (r.count ?? 0), 0);

  // Pricing position vs. comparable published listings in the same category.
  let pricing: PricingPosition | null = null;
  if (categoryId && yourPrice != null) {
    const { data: peers } = await supabase
      .from("services")
      .select("id, service_packages ( price_gbp )")
      .eq("category_id", categoryId)
      .eq("status", "published")
      .neq("id", serviceId)
      .limit(300);

    const peerLows = ((peers ?? []) as Array<{ id: string; service_packages: Array<{ price_gbp: number | null }> }>)
      .map((p) => lowestPrice(p.service_packages.map((x) => x.price_gbp)))
      .filter((v): v is number => v != null);

    if (peerLows.length >= 3) {
      const med = median(peerLows);
      const position: PricingPosition["position"] =
        yourPrice < med * 0.9 ? "below" : yourPrice > med * 1.1 ? "above" : "around";
      pricing = { yourPrice, median: med, position, sampleSize: peerLows.length };
    }
  }

  return { views, views30d, enquiries: enquiries ?? 0, pricing };
}
