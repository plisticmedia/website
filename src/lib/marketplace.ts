import { createSupabaseServerClient } from "@/lib/supabase/server";

/** A marketplace item, joined to the listing (business) that sells it. */
export type MarketplaceItem = {
  id: string;
  title: string;
  description: string | null;
  price_gbp: number | null;
  product_type: "physical" | "service";
  stock: number | null;
  fulfilment: "shipping" | "collection" | "both" | null;
  delivery_info: string | null;
  revision_limit: number | null;
  status: string;
  images: string[];
  seller: {
    service_id: string;
    slug: string;
    business: string;
    location: string | null;
    logo_url: string | null;
    payouts_enabled: boolean;
  };
};

const ITEM_SELECT = `
  id, title, description, price_gbp, product_type, stock, fulfilment, delivery_info, revision_limit, status,
  product_media ( url, sort_order ),
  services!inner ( id, slug, title, status, logo_url, locations!location_id ( name ), profiles ( payouts_enabled ) )
`;

type Row = {
  id: string;
  title: string;
  description: string | null;
  price_gbp: number | null;
  product_type: "physical" | "service";
  stock: number | null;
  fulfilment: "shipping" | "collection" | "both" | null;
  delivery_info: string | null;
  revision_limit: number | null;
  status: string;
  product_media: Array<{ url: string; sort_order: number }> | null;
  services: {
    id: string;
    slug: string;
    title: string;
    status: string;
    logo_url: string | null;
    locations: { name: string } | null;
    profiles: { payouts_enabled: boolean | null } | null;
  } | null;
};

function toItem(row: Row): MarketplaceItem | null {
  const s = row.services;
  if (!s) return null;
  const images = [...(row.product_media ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((m) => m.url);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price_gbp: row.price_gbp,
    product_type: row.product_type,
    stock: row.stock,
    fulfilment: row.fulfilment,
    delivery_info: row.delivery_info,
    revision_limit: row.revision_limit,
    status: row.status,
    images,
    seller: {
      service_id: s.id,
      slug: s.slug,
      business: s.title,
      location: s.locations?.name ?? null,
      logo_url: s.logo_url,
      payouts_enabled: !!s.profiles?.payouts_enabled,
    },
  };
}

export type MarketplaceQuery = {
  q?: string;
  type?: "physical" | "service";
  page?: number;
};

export type MarketplaceResult = {
  items: MarketplaceItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

const PAGE_SIZE = 24;

/** Central marketplace browse: active items on published listings. RLS also enforces this. */
export async function getMarketplaceItems(query: MarketplaceQuery = {}): Promise<MarketplaceResult> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, query.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let builder = supabase
    .from("products")
    .select(ITEM_SELECT, { count: "exact" })
    .eq("status", "active")
    .eq("services.status", "published");

  if (query.type === "physical" || query.type === "service") {
    builder = builder.eq("product_type", query.type);
  }
  if (query.q && query.q.trim()) {
    const term = query.q.trim().replace(/[%,()]/g, " ");
    builder = builder.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
  }

  const { data, count } = await builder
    .order("created_at", { ascending: false })
    .range(from, to);

  const items = ((data ?? []) as unknown as Row[]).map(toItem).filter((x): x is MarketplaceItem => x !== null);
  const total = count ?? items.length;
  return {
    items,
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

/** Active items for one listing (shown on the public profile). */
export async function getItemsForService(serviceId: string): Promise<MarketplaceItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("products")
    .select(ITEM_SELECT)
    .eq("status", "active")
    .eq("service_id", serviceId)
    .eq("services.status", "published")
    .order("sort_order", { ascending: true });
  return ((data ?? []) as unknown as Row[]).map(toItem).filter((x): x is MarketplaceItem => x !== null);
}

/** A single item for its public page. */
export async function getMarketplaceItem(id: string): Promise<MarketplaceItem | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("products")
    .select(ITEM_SELECT)
    .eq("id", id)
    .eq("status", "active")
    .eq("services.status", "published")
    .maybeSingle();
  return data ? toItem(data as unknown as Row) : null;
}
