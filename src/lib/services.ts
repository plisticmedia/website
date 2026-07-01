import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Category, Location, Service, ServiceWithRelations } from "@/lib/types";

const PAGE_SIZE = 12;

export type DirectoryQuery = {
  q?: string;
  category?: string;
  location?: string;
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
  categories ( slug, name ),
  locations ( slug, name ),
  listing_services ( categories ( slug, name ) ),
  service_areas ( locations ( slug, name ) ),
  profiles ( id, display_name, bio, avatar_url, website_url ),
  service_packages ( id, service_id, name, price_gbp, delivery_days, features, sort_order ),
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

  const { data, count, error } = await builder
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to load directory: ${error.message}`);
  }

  const total = count ?? 0;
  return {
    services: (data ?? []) as unknown as ServiceWithRelations[],
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
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
};

/** Published listings that have coordinates, matching the current filters — for the map. */
export async function getMapPoints(query: DirectoryQuery = {}): Promise<MapPoint[]> {
  const supabase = await createSupabaseServerClient();
  let builder = supabase
    .from("services")
    .select("id, slug, title, latitude, longitude, is_featured, categories(name), locations(name)")
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

  const { data, error } = await builder.limit(1000);
  if (error) throw new Error(`Failed to load map points: ${error.message}`);

  type Row = {
    id: string; slug: string; title: string; latitude: number; longitude: number;
    is_featured: boolean; categories: { name: string } | null; locations: { name: string } | null;
  };
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id, slug: r.slug, title: r.title, latitude: r.latitude, longitude: r.longitude,
    is_featured: r.is_featured, category: r.categories?.name ?? null, location: r.locations?.name ?? null,
  }));
}

export type DensityPoint = { slug: string; name: string; lat: number; lng: number; count: number };

// Centroids for the standard Scottish regions (no migration needed). Locations
// not in this map (e.g. "Scotland-wide/remote") simply don't appear on the map.
const REGION_CENTROIDS: Record<string, [number, number]> = {
  glasgow: [55.8642, -4.2518],
  edinburgh: [55.9533, -3.1883],
  aberdeen: [57.1497, -2.0943],
  dundee: [56.462, -2.9707],
  stirling: [56.1165, -3.9369],
  "highlands-islands": [57.4778, -4.2247],
  "south-scotland": [55.1, -3.4],
  fife: [56.2082, -3.1495],
};

/** How many published listings operate in each located region — for the density map. */
export async function getServiceDensity(category?: string): Promise<DensityPoint[]> {
  const supabase = await createSupabaseServerClient();

  const [{ data: locs }, { data: pub }] = await Promise.all([
    supabase.from("locations").select("id, slug, name"),
    supabase.from("services").select("id, category_id").eq("status", "published"),
  ]);

  let allowed = new Set((pub ?? []).map((s) => s.id as string));
  if (category) {
    const { data: cat } = await supabase.from("categories").select("id").eq("slug", category).maybeSingle();
    if (cat?.id) {
      const inCat = new Set(
        (pub ?? []).filter((s) => s.category_id === cat.id).map((s) => s.id as string),
      );
      const { data: tagged } = await supabase.from("listing_services").select("service_id").eq("category_id", cat.id);
      (tagged ?? []).forEach((t) => inCat.add(t.service_id as string));
      allowed = new Set([...allowed].filter((id) => inCat.has(id)));
    }
  }

  const { data: areas } = await supabase.from("service_areas").select("service_id, location_id");
  const counts = new Map<string, number>();
  for (const a of areas ?? []) {
    if (allowed.has(a.service_id as string)) {
      counts.set(a.location_id as string, (counts.get(a.location_id as string) ?? 0) + 1);
    }
  }

  type LocRow = { id: string; slug: string; name: string };
  return ((locs ?? []) as LocRow[])
    .map((l) => {
      const centroid = REGION_CENTROIDS[l.slug];
      const count = counts.get(l.id) ?? 0;
      return centroid && count > 0
        ? { slug: l.slug, name: l.name, lat: centroid[0], lng: centroid[1], count }
        : null;
    })
    .filter((p): p is DensityPoint => p !== null);
}

/** Public listing detail by slug. Returns null if not published / not found. */
export async function getServiceBySlug(slug: string): Promise<ServiceWithRelations | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("services")
    .select(LISTING_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load listing: ${error.message}`);
  }
  return (data as unknown as ServiceWithRelations) ?? null;
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
