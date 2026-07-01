import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

type Taxon = { id: string; name: string; slug: string; sort_order: number };

/** Normalised key so "Video production" and "Video Production" collapse together. */
function key(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Merges duplicate categories and locations that differ only by case, spacing
 * or punctuation. References (the single FK column plus the m2m join tables) are
 * repointed to a single keeper, then the duplicates are deleted. The keeper is
 * the one with the lowest sort_order (seeded taxa win over imported ones).
 */
export async function consolidateTaxonomy(): Promise<{ categories: number; locations: number }> {
  const supabase = createSupabaseServiceRoleClient();
  const categories = await mergeTable("categories", "category_id", "listing_services", supabase);
  const locations = await mergeTable("locations", "location_id", "service_areas", supabase);
  return { categories, locations };
}

async function mergeTable(
  table: "categories" | "locations",
  fkColumn: "category_id" | "location_id",
  joinTable: "listing_services" | "service_areas",
  supabase: ReturnType<typeof createSupabaseServiceRoleClient>,
): Promise<number> {
  const { data } = await supabase.from(table).select("id, name, slug, sort_order");
  const rows = (data ?? []) as Taxon[];

  const groups = new Map<string, Taxon[]>();
  for (const row of rows) {
    const k = key(row.name);
    if (!k) continue;
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(row);
  }

  let mergedCount = 0;
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => a.sort_order - b.sort_order || a.slug.length - b.slug.length);
    const keeper = group[0];
    for (const loser of group.slice(1)) {
      // 1) Direct FK on services.
      await supabase.from("services").update({ [fkColumn]: keeper.id }).eq(fkColumn, loser.id);

      // 2) Many-to-many join, avoiding (service_id, keeper) primary-key clashes.
      const { data: keepRows } = await supabase.from(joinTable).select("service_id").eq(fkColumn, keeper.id);
      const keepSet = new Set(((keepRows ?? []) as Array<{ service_id: string }>).map((r) => r.service_id));
      const { data: loseRows } = await supabase.from(joinTable).select("service_id").eq(fkColumn, loser.id);
      for (const lr of (loseRows ?? []) as Array<{ service_id: string }>) {
        if (keepSet.has(lr.service_id)) {
          await supabase.from(joinTable).delete().eq(fkColumn, loser.id).eq("service_id", lr.service_id);
        } else {
          await supabase.from(joinTable).update({ [fkColumn]: keeper.id }).eq(fkColumn, loser.id).eq("service_id", lr.service_id);
          keepSet.add(lr.service_id);
        }
      }

      // 3) Remove the duplicate taxon.
      await supabase.from(table).delete().eq("id", loser.id);
      mergedCount += 1;
    }
  }

  return mergedCount;
}
