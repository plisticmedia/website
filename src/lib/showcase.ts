import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export type ShowcaseKind = "video" | "image" | "event" | "news" | "work";

export type ShowcaseItem = {
  id: string;
  kind: ShowcaseKind;
  title: string;
  summary: string | null;
  body: string | null;
  image_url: string | null;
  embed_url: string | null;
  link_url: string | null;
  source: string | null;
  location: string | null;
  event_date: string | null;
  is_featured: boolean;
  published_at: string | null;
};

const FIELDS =
  "id, kind, title, summary, body, image_url, embed_url, link_url, source, location, event_date, is_featured, published_at";

/** Published showcase items, featured first then newest. Optional kind filter. */
export async function getShowcaseItems(kind?: ShowcaseKind): Promise<ShowcaseItem[]> {
  const supabase = await createSupabaseServerClient();
  let builder = supabase
    .from("showcase_items")
    .select(FIELDS)
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(120);
  if (kind) builder = builder.eq("kind", kind);
  const { data } = await builder;
  return (data ?? []) as ShowcaseItem[];
}

/** A single published showcase item by id, for its full-story page. */
export async function getShowcaseItemById(id: string): Promise<ShowcaseItem | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("showcase_items")
    .select(FIELDS)
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  return (data as ShowcaseItem) ?? null;
}

/**
 * Where a showcase card should link. If the item has its own written story
 * (a body), open our full-story page; otherwise fall back to any external/on-site
 * link it carries. Items with neither aren't links.
 */
export function showcaseHref(item: Pick<ShowcaseItem, "id" | "body" | "link_url">): string | null {
  if (item.body && item.body.trim()) return `/showcase/${item.id}`;
  return item.link_url || null;
}

/** Admin: pending submissions awaiting review. Service role. */
export async function getPendingShowcaseItems(): Promise<ShowcaseItem[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("showcase_items")
    .select(FIELDS + ", submitter_email, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  return (data ?? []) as ShowcaseItem[];
}

/** Convert a YouTube/Vimeo URL to an embeddable URL, or null if unrecognised. */
export function toShowcaseEmbed(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.startsWith("/embed/")) return url;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
    if (host === "player.vimeo.com") return url;
  } catch {
    return null;
  }
  return null;
}
