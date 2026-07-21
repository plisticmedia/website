import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Category, Location, Service, ServiceWithRelations } from "@/lib/types";

const PAGE_SIZE = 12;

export type DirectoryQuery = {
  q?: string;
  category?: string;
  location?: string;
  rating?: number;
  page?: number;
};

export type DirectoryResult = {
  services: ServiceWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

const LISTING_SELECT = `
  *,
  categories!category_id ( slug, name ),
  locations!location_id ( slug, name ),
  listing_services ( categories ( slug, name ) ),
  service_areas ( locations ( slug, name ) ),
  profiles ( id, display_name, bio, avatar_url, website_url, payouts_enabled ),
  service_packages ( id, service_id, name, price_gbp, delivery_days, features, sort_order, is_bookable ),
  service_media ( id, service_id, url, kind, sort_order )
`;

/** Public directory: published listings only, featured first. RLS enforces visibility. */
export async function getPublishedServices(query: DirectoryQuery = {}): Promise<DirectoryResult> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, query.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let builder = supabase
    .from("services")
    .select(LISTING_SELECT, { count: "exact" })
    .eq("status", "published");

  if (query.category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", query.category)
      .maybeSingle();
    if (cat?.id) {
      // Match listings whose primary category OR a tagged service is this category.
      const { data: tagged } = await supabase
        .from("listing_services")
        .select("service_id")
        .eq("category_id", cat.id);
      const ids = (tagged ?? []).map((t) => t.service_id as string);
      if (ids.length > 0) {
        builder = builder.or(`category_id.eq.${cat.id},id.in.(${ids.join(",")})`);
      } else {
        builder = builder.eq("category_id", cat.id);
      }
    }
  }

  if (query.location) {
    const { data: loc } = await supabase
      .from("locations")
      .select("id")
      .eq("slug", query.location)
      .maybeSingle();
    if (loc?.id) {
      // "Operates in" this area (coverage), or is based there.
      const { data: areas } = await supabase.from("service_areas").select("service_id").eq("location_id", loc.id);
      const ids = (areas ?? []).map((a) => a.service_id as string);
      builder = ids.length > 0 ? builder.or(`location_id.eq.${loc.id},id.in.(${ids.join(",")})`) : builder.eq("location_id", loc.id);
    }
  }

  if (query.q) {
    const term = `%${query.q.replace(/[%_]/g, "")}%`;
    builder = builder.or(`title.ilike.${term},summary.ilike.${term}`);
  }

  if (query.rating) {
    builder = builder.gte("google_rating", query.rating);
  }

  const { data, error } = await builder
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(`Failed to load directory: ${error.message}`);
  }

  // Rank so the fullest-looking listings lead every page: featured first, then
  // any with a logo (never open on empty-looking cards), then by rating, then
  // newest. Done here rather than in SQL so "has a logo" can be a real sort key.
  const ranked = ((data ?? []) as unknown as ServiceWithRelations[]).slice().sort((a, b) => {
    const fa = a as unknown as ListingRank;
    const fb = b as unknown as ListingRank;
    return (
      Number(!!fb.is_featured) - Number(!!fa.is_featured) ||
      Number(!!fb.logo_url) - Number(!!fa.logo_url) ||
      (fb.google_rating ?? 0) - (fa.google_rating ?? 0) ||
      new Date(fb.created_at).getTime() - new Date(fa.created_at).getTime()
    );
  });

  const total = ranked.length;
  return {
    services: ranked.slice(from, to + 1),
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

type ListingRank = { is_featured: boolean; logo_url: string | null; google_rating: number | null; created_at: string };

export type CompareRow = {
  slug: string;
  title: string;
  logo_url: string | null;
  category: string | null;
  categorySlug: string | null;
  rating: number | null;
  ratingCount: number | null;
  fromPrice: number;
  deliveryDays: number | null;
  isFeatured: boolean;
  bookable: boolean; // cheapest package is bookable AND the seller can take payouts
};

/**
 * Published listings that have at least one bookable package from a seller who
 * can receive payouts — i.e. things a buyer can actually book and compare.
 * Returns the rows plus the distinct categories present (for a filter).
 */
export async function getComparableServices(
  categorySlug?: string,
  sort?: string,
  maxPrice?: number,
): Promise<{ rows: CompareRow[]; categories: Array<{ slug: string; name: string }> }> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("services")
    .select(
      "slug, title, logo_url, is_featured, google_rating, google_rating_count, categories!category_id(name, slug), profiles(payouts_enabled), service_packages(price_gbp, delivery_days, is_bookable)",
    )
    .eq("status", "published")
    .limit(400);

  type Row = {
    slug: string; title: string; logo_url: string | null; is_featured: boolean;
    google_rating: number | null; google_rating_count: number | null;
    categories: { name: string; slug: string } | null;
    profiles: { payouts_enabled: boolean } | null;
    service_packages: Array<{ price_gbp: number | null; delivery_days: number | null; is_bookable: boolean }>;
  };

  const rows: CompareRow[] = [];
  const cats = new Map<string, string>();
  for (const r of (data ?? []) as unknown as Row[]) {
    // Any package with a real price counts — display or bookable — so buyers can
    // compare and enquire even before a seller has switched on online booking.
    const priced = r.service_packages.filter((p) => typeof p.price_gbp === "number" && p.price_gbp > 0);
    if (priced.length === 0) continue;
    const cheapest = priced.reduce((a, b) => (a.price_gbp! <= b.price_gbp! ? a : b));
    if (r.categories?.slug) cats.set(r.categories.slug, r.categories.name);
    rows.push({
      slug: r.slug,
      title: r.title,
      logo_url: r.logo_url,
      category: r.categories?.name ?? null,
      categorySlug: r.categories?.slug ?? null,
      rating: r.google_rating,
      ratingCount: r.google_rating_count,
      fromPrice: cheapest.price_gbp as number,
      deliveryDays: cheapest.delivery_days,
      isFeatured: r.is_featured,
      bookable: !!cheapest.is_bookable && !!r.profiles?.payouts_enabled,
    });
  }

  let filtered = categorySlug ? rows.filter((r) => r.categorySlug === categorySlug) : rows;
  if (typeof maxPrice === "number" && maxPrice > 0) filtered = filtered.filter((r) => r.fromPrice <= maxPrice);

  if (sort === "price_desc") {
    filtered.sort((a, b) => b.fromPrice - a.fromPrice);
  } else if (sort === "rating") {
    filtered.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1) || a.fromPrice - b.fromPrice);
  } else {
    // Default: featured first, then cheapest.
    filtered.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.fromPrice - b.fromPrice);
  }

  const categories = [...cats.entries()].map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name));
  return { rows: filtered, categories };
}

export type MapPoint = {
  id: string;
  slug: string;
  title: string;
  latitude: number;
  longitude: number;
  is_featured: boolean;
  category: string | null;
  location: string | null;
  address: string | null;
};

/** Published listings that have coordinates, matching the current filters — for the map. */
export async function getMapPoints(query: DirectoryQuery = {}): Promise<MapPoint[]> {
  const supabase = await createSupabaseServerClient();
  let builder = supabase
    .from("services")
    .select("id, slug, title, latitude, longitude, is_featured, address, postcode, categories!category_id(name), locations!location_id(name)")
    .eq("status", "published")
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (query.category) {
    const { data: cat } = await supabase.from("categories").select("id").eq("slug", query.category).maybeSingle();
    if (cat?.id) {
      const { data: tagged } = await supabase.from("listing_services").select("service_id").eq("category_id", cat.id);
      const ids = (tagged ?? []).map((t) => t.service_id as string);
      builder = ids.length > 0 ? builder.or(`category_id.eq.${cat.id},id.in.(${ids.join(",")})`) : builder.eq("category_id", cat.id);
    }
  }
  if (query.location) {
    const { data: loc } = await supabase.from("locations").select("id").eq("slug", query.location).maybeSingle();
    if (loc?.id) {
      const { data: areas } = await supabase.from("service_areas").select("service_id").eq("location_id", loc.id);
      const ids = (areas ?? []).map((a) => a.service_id as string);
      builder = ids.length > 0 ? builder.or(`location_id.eq.${loc.id},id.in.(${ids.join(",")})`) : builder.eq("location_id", loc.id);
    }
  }
  if (query.q) {
    const term = `%${query.q.replace(/[%_]/g, "")}%`;
    builder = builder.or(`title.ilike.${term},summary.ilike.${term}`);
  }
  if (query.rating) {
    builder = builder.gte("google_rating", query.rating);
  }

  const { data, error } = await builder.limit(1000);
  if (error) throw new Error(`Failed to load map points: ${error.message}`);

  type Row = {
    id: string; slug: string; title: string; latitude: number; longitude: number; is_featured: boolean;
    address: string | null; postcode: string | null; categories: { name: string } | null; locations: { name: string } | null;
  };
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id, slug: r.slug, title: r.title, latitude: r.latitude, longitude: r.longitude,
    is_featured: r.is_featured, category: r.categories?.name ?? null, location: r.locations?.name ?? null,
    address: [r.address, r.postcode].filter(Boolean).join(", ") || null,
  }));
}

export type UnlocatedService = { slug: string; title: string; areas: string[]; is_featured: boolean };

/**
 * Published listings that can't be pinned (no geocoded address) — typically
 * "Scotland-wide" / remote businesses. Shown as a list beside the map so they
 * are never lost just because they don't sit at a single point.
 */
export async function getUnlocatedServices(query: DirectoryQuery = {}): Promise<UnlocatedService[]> {
  const supabase = await createSupabaseServerClient();
  let builder = supabase
    .from("services")
    .select("id, slug, title, is_featured, service_areas ( locations ( name ) )")
    .eq("status", "published")
    .or("latitude.is.null,longitude.is.null");

  if (query.category) {
    const { data: cat } = await supabase.from("categories").select("id").eq("slug", query.category).maybeSingle();
    if (cat?.id) {
      const { data: tagged } = await supabase.from("listing_services").select("service_id").eq("category_id", cat.id);
      const ids = (tagged ?? []).map((t) => t.service_id as string);
      builder = ids.length > 0 ? builder.or(`category_id.eq.${cat.id},id.in.(${ids.join(",")})`) : builder.eq("category_id", cat.id);
    }
  }
  if (query.location) {
    const { data: loc } = await supabase.from("locations").select("id").eq("slug", query.location).maybeSingle();
    if (loc?.id) {
      const { data: areas } = await supabase.from("service_areas").select("service_id").eq("location_id", loc.id);
      const ids = (areas ?? []).map((a) => a.service_id as string);
      builder = ids.length > 0 ? builder.or(`location_id.eq.${loc.id},id.in.(${ids.join(",")})`) : builder.eq("location_id", loc.id);
    }
  }
  if (query.q) {
    const term = `%${query.q.replace(/[%_]/g, "")}%`;
    builder = builder.or(`title.ilike.${term},summary.ilike.${term}`);
  }
  if (query.rating) {
    builder = builder.gte("google_rating", query.rating);
  }

  const { data, error } = await builder.limit(500);
  if (error) throw new Error(`Failed to load unlocated listings: ${error.message}`);

  type Row = {
    slug: string; title: string; is_featured: boolean;
    service_areas: { locations: { name: string } | null }[] | null;
  };
  return ((data ?? []) as unknown as Row[])
    .map((r) => ({
      slug: r.slug,
      title: r.title,
      is_featured: r.is_featured,
      areas: (r.service_areas ?? []).map((a) => a.locations?.name).filter((n): n is string => !!n),
    }))
    .sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || a.title.localeCompare(b.title));
}

/** Curated showcase: published listings that are verified or founding partners. */
export async function getShowcaseServices(): Promise<ServiceWithRelations[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("services")
    .select(LISTING_SELECT)
    .eq("status", "published")
    .or("verified.eq.true,founding.eq.true")
    .order("founding", { ascending: false })
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw new Error(`Failed to load showcase: ${error.message}`);
  return (data ?? []) as unknown as ServiceWithRelations[];
}

/** Public listing detail by slug. Returns null if not published / not found. */
export async function getServiceBySlug(slug: string): Promise<ServiceWithRelations | null> {
  const supabase = await createSupabaseServerClient();
  // No status filter here — RLS governs visibility: the public can read only
  // published listings, while an admin (or the owner) can also read a listing
  // still "in review", so they can preview it before it goes live.
  // Use limit(2) + pick (not maybeSingle) so a stray duplicate slug can never
  // throw and take the page down; prefer the published row when there's a tie.
  const { data, error } = await supabase
    .from("services")
    .select(LISTING_SELECT)
    .eq("slug", slug)
    .limit(2);

  if (error) {
    throw new Error(`Failed to load listing: ${error.message}`);
  }
  const rows = (data as unknown as ServiceWithRelations[]) ?? [];
  return rows.find((r) => r.status === "published") ?? rows[0] ?? null;
}

export type ServiceReview = {
  id: string;
  rating: number;
  body: string | null;
  created_at: string;
  buyer_name: string | null;
};

/**
 * Public, non-expired reviews for a listing plus their average. RLS ("reviews:
 * public read") already limits this to non-expired reviews on published
 * listings, so no extra filtering is needed here.
 */
export async function getServiceReviews(
  serviceId: string,
): Promise<{ reviews: ServiceReview[]; average: number | null; count: number }> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, rating, body, created_at, profiles ( display_name )")
    .eq("service_id", serviceId)
    .order("created_at", { ascending: false });

  type Row = { id: string; rating: number; body: string | null; created_at: string; profiles: { display_name: string | null } | null };
  const rows = (data ?? []) as unknown as Row[];
  const reviews: ServiceReview[] = rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    body: r.body,
    created_at: r.created_at,
    buyer_name: r.profiles?.display_name ?? null,
  }));
  const count = reviews.length;
  const average = count > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : null;
  return { reviews, average, count };
}

/** All listings owned by the signed-in seller (any status). RLS scopes to the owner. */
export async function getSellerServices(sellerId: string): Promise<ServiceWithRelations[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("services")
    .select(LISTING_SELECT)
    .eq("seller_id", sellerId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load your listings: ${error.message}`);
  }
  return (data ?? []) as unknown as ServiceWithRelations[];
}

/** A single listing owned by the seller, by id (any status). */
export async function getSellerServiceById(
  sellerId: string,
  id: string,
): Promise<ServiceWithRelations | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("services")
    .select(LISTING_SELECT)
    .eq("id", id)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load listing: ${error.message}`);
  }
  return (data as unknown as ServiceWithRelations) ?? null;
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }
  return (data ?? []) as Category[];
}

export async function getLocations(): Promise<Location[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to load locations: ${error.message}`);
  }
  return (data ?? []) as Location[];
}

/** Builds a URL-safe, unique-ish slug from a title. */
export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "listing"}-${suffix}`;
}

export type { Service };
