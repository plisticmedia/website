import type { MetadataRoute } from "next";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.plisticmedia.com";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "",
    "/directory",
    "/directory/density",
    "/pricing",
    "/earn",
    "/about",
    "/book",
    "/terms",
    "/privacy",
  ];
  const routes: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }));

  // Add published listings if the database is reachable/configured.
  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createSupabaseServiceRoleClient();
      const { data } = await supabase
        .from("services")
        .select("slug, updated_at")
        .eq("status", "published")
        .limit(5000);
      for (const s of data ?? []) {
        routes.push({
          url: `${BASE}/directory/${s.slug}`,
          lastModified: s.updated_at ? new Date(s.updated_at) : undefined,
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    }
  } catch {
    // DB unavailable (e.g. at build time) — static routes are enough.
  }

  return routes;
}
