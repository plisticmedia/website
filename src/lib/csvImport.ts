import type { SupabaseClient } from "@supabase/supabase-js";

/** Minimal CSV parser: handles quotes, escaped quotes, commas and newlines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === "\r") { /* ignore */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}
function norm(h: string) {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}
function pick(r: Record<string, string>, keys: string[]) {
  for (const k of keys) {
    const v = r[k];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

async function ensureTaxon(supabase: SupabaseClient, table: "categories" | "locations", name: string) {
  const slug = slugify(name);
  if (!slug) return null;
  const { data: existing } = await supabase.from(table).select("id").eq("slug", slug).maybeSingle();
  if (existing?.id) return existing.id as string;
  const { data } = await supabase.from(table).insert({ name, slug, sort_order: 500 }).select("id").single();
  return (data?.id as string) ?? null;
}

export type ImportResult = { created: number; skipped: number; errors: string[] };

/** Import listings from raw CSV text using a service-role client. */
export async function importListingsFromCsv(
  supabase: SupabaseClient,
  csvText: string,
  publish: boolean,
): Promise<ImportResult> {
  const matrix = parseCsv(csvText);
  const result: ImportResult = { created: 0, skipped: 0, errors: [] };
  if (matrix.length < 2) {
    result.errors.push("CSV had no data rows.");
    return result;
  }
  const headers = matrix[0].map(norm);

  for (const cells of matrix.slice(1)) {
    const r: Record<string, string> = {};
    headers.forEach((h, i) => { r[h] = cells[i] ?? ""; });

    const title = pick(r, ["name", "businessname", "business", "company", "studio"]);
    if (!title) { result.skipped += 1; continue; }
    const slug = slugify(title);

    const { data: dupe } = await supabase.from("services").select("id").eq("slug", slug).maybeSingle();
    if (dupe?.id) { result.skipped += 1; continue; }

    const serviceNames = pick(r, ["services", "service", "category", "categories", "discipline"])
      .split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
    const description = pick(r, ["description", "about", "bio", "summary"]);
    const summary = pick(r, ["summary", "tagline"]) || description.slice(0, 280);
    const locationName = pick(r, ["location", "area", "region", "city", "town"]);
    const website = pick(r, ["website", "url", "site", "weblink"]);
    const logo = pick(r, ["logo", "logourl", "logolink"]);
    const partnerFlag = pick(r, ["founding", "foundingpartner", "trusted", "trustedpartner", "partner", "featured"]);
    const isFeatured = /^(y|yes|true|1)/i.test(partnerFlag);

    const social: Record<string, string> = {};
    for (const net of ["instagram", "linkedin", "facebook", "tiktok", "twitter", "youtube"]) {
      const v = pick(r, [net]);
      if (v) social[net] = v;
    }

    const categoryIds: string[] = [];
    for (const name of serviceNames) {
      const id = await ensureTaxon(supabase, "categories", name);
      if (id) categoryIds.push(id);
    }
    const locationId = locationName ? await ensureTaxon(supabase, "locations", locationName) : null;

    const { data: inserted, error } = await supabase
      .from("services")
      .insert({
        seller_id: null,
        slug,
        title,
        summary: summary || null,
        description: description || null,
        category_id: categoryIds[0] ?? null,
        location_id: locationId,
        website_url: website || null,
        logo_url: logo || null,
        cover_image_url: logo || null,
        address: pick(r, ["address", "streetaddress"]) || null,
        postcode: pick(r, ["postcode", "postalcode", "zip"]) || null,
        social_links: social,
        status: publish ? "published" : "pending",
        is_featured: isFeatured,
        featured_until: isFeatured ? new Date(Date.now() + 365 * 864e5).toISOString() : null,
      })
      .select("id")
      .single();

    if (error) { result.errors.push(`${title}: ${error.message}`); result.skipped += 1; continue; }

    if (categoryIds.length) {
      await supabase.from("listing_services").insert(
        categoryIds.map((cid) => ({ service_id: inserted.id, category_id: cid })),
      );
    }
    result.created += 1;
  }

  return result;
}
