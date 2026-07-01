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

  if (query.rating) {
    builder = builder.gte("google_rating", query.rating);
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
