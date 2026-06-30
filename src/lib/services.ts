import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Category, Service, ServiceWithRelations } from "@/lib/types";

const PAGE_SIZE = 12;

export type DirectoryQuery = {
  q?: string;
  category?: string;
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
      builder = builder.eq("category_id", cat.id);
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
