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
const SOCIAL_DOMAINS: Array<[RegExp, string]> = [
  [/instagram\.com/i, "instagram"],
  [/(linkedin\.com|lnkd\.in)/i, "linkedin"],
  [/(facebook\.com|fb\.com|fb\.me)/i, "facebook"],
  [/tiktok\.com/i, "tiktok"],
  [/(twitter\.com|x\.com)/i, "twitter"],
  [/(youtube\.com|youtu\.be)/i, "youtube"],
];
function classifySocial(url: string): string | null {
  for (const [re, net] of SOCIAL_DOMAINS) if (re.test(url)) return net;
  return null;
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

export type ImportResult = { created: number; updated: number; skipped: number; errors: string[] };

/** Import listings from raw CSV text using a service-role client. */
export async function importListingsFromCsv(
  supabase: SupabaseClient,
  csvText: string,
  publish: boolean,
): Promise<ImportResult> {
  const matrix = parseCsv(csvText);
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };
  if (matrix.length < 2) {
    result.errors.push("CSV had no data rows.");
    return result;
  }
  const headers = matrix[0].map(norm);

  for (const cells of matrix.slice(1)) {
    const r: Record<string, string> = {};
    headers.forEach((h, i) => { r[h] = cells[i] ?? ""; });

    const title = pick(r, [
      "name", "businessname", "business", "company", "studio",
      "companyorindividualname", "companyorindividual", "individualorcompanyname",
    ]);
    if (!title) { result.skipped += 1; continue; }
    const slug = slugify(title);

    // Respect publish consent when the form asked for it.
    const consent = pick(r, [
      "imhappyforthedetailsabovetobepublishedinthescotlandmediadirectory", "consent", "publish",
    ]);
    if (consent && /^(n|no|false|0)/i.test(consent)) { result.skipped += 1; continue; }

    // A listing may already exist. Update owner-less (imported) ones from the
    // sheet; never overwrite a listing a seller has claimed.
    const { data: dupe } = await supabase
      .from("services")
      .select("id, seller_id")
      .eq("slug", slug)
      .maybeSingle();
    if (dupe?.id && dupe.seller_id) { result.skipped += 1; continue; }

    const serviceNames = [
      pick(r, ["services", "service", "category", "categories", "discipline", "whatcategorybestdescribesyourservices"]),
      pick(r, ["ifyouselectedotherpleasetelluswhatyoudo", "other"]),
    ]
      .filter(Boolean)
      .join(",")
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const shortDesc = pick(r, ["ashortdescriptionofyourcompanyandwhatyoudo", "description", "about", "bio"]);
    const longDesc = pick(r, ["tellusmoreaboutyourbusiness"]);
    const summary = (pick(r, ["summary", "tagline"]) || shortDesc || title).slice(0, 280);
    const description = [shortDesc, longDesc].filter(Boolean).join("\n\n") || shortDesc || null;
    // Base location -> map pin + shown publicly (geocoded from address/postcode/town).
    const explicitAddress = pick(r, ["businessaddress", "address", "streetaddress"]);
    const baseText = pick(r, ["whereisyourcompanybased", "basedin", "location", "city", "town"]);
    const postcode = pick(r, ["postcode", "postalcode", "zip"]);
    // Operating areas -> coverage (Location filter + density). Split multi-values.
    const operatesText = pick(r, [
      "wheredoesyourbusinessoperate", "whichareasofscotlanddoyouworkin", "whichareasdoyouworkin",
      "areasyouworkin", "areasyoucover", "areasyouoperatein", "operates", "coverage", "area", "region",
    ]);
    const areaNames = (operatesText || baseText)
      .split(/[,;|/]|\band\b/i)
      .map((s) => s.trim())
      .filter(Boolean);
    const website = pick(r, ["website", "url", "site", "weblink"]);
    const logo = pick(r, ["logo", "logourl", "logolink", "logoorprofileimage", "profileimage"]);
    const partnerFlag = pick(r, ["founding", "foundingpartner", "trusted", "trustedpartner", "partner", "featured"]);
    const isFeatured = /^(y|yes|true|1)/i.test(partnerFlag);

    // Social + Google links. Robust: scan EVERY answer for links so we never
    // miss them just because the form column was named unexpectedly.
    const social: Record<string, string> = {};
    for (const net of ["instagram", "linkedin", "facebook", "tiktok", "twitter", "youtube"]) {
      const v = pick(r, [net]);
      if (v) social[net] = v;
    }
    let googleProfile = "";
    const urlRe = /https?:\/\/[^\s,;"'|]+/gi;
    for (const val of Object.values(r)) {
      const found = String(val).match(urlRe);
      if (!found) continue;
      for (const link of found) {
        const net = classifySocial(link);
        if (net) {
          if (!social[net]) social[net] = link;
        } else if (!googleProfile && /(google\.[^/]+\/maps|maps\.app\.goo\.gl|g\.page|business\.google)/i.test(link)) {
          googleProfile = link;
        }
      }
    }
    if (googleProfile) social.google = googleProfile;
    // If the Google link embeds a real place id, use it for an accurate rating.
    const placeIdFromUrl = googleProfile ? googleProfile.match(/ChIJ[-\w]+/)?.[0] ?? null : null;

    const categoryIds: string[] = [];
    for (const name of serviceNames) {
      const id = await ensureTaxon(supabase, "categories", name);
      if (id) categoryIds.push(id);
    }
    const areaIds: string[] = [];
    for (const name of areaNames) {
      const id = await ensureTaxon(supabase, "locations", name);
      if (id && !areaIds.includes(id)) areaIds.push(id);
    }

    // Content fields shared by insert + update (base location = pin + display).
    const content = {
      title,
      summary: summary || null,
      description: description || null,
      category_id: categoryIds[0] ?? null,
      location_id: areaIds[0] ?? null,
      website_url: website || null,
      logo_url: logo || null,
      cover_image_url: logo || null,
      address: explicitAddress || baseText || null,
      postcode: postcode || null,
      social_links: social,
      // Only set the Google place when the profile link contained a real id;
      // never wipe an existing match on re-import.
      ...(placeIdFromUrl ? { google_place_id: placeIdFromUrl } : {}),
      // Re-geocode next time the admin runs the map tool.
      latitude: null,
      longitude: null,
    };

    let serviceId: string;
    if (dupe?.id) {
      // Update an existing imported (owner-less) listing; keep its status/featured.
      const { error } = await supabase.from("services").update(content).eq("id", dupe.id);
      if (error) { result.errors.push(`${title}: ${error.message}`); result.skipped += 1; continue; }
      serviceId = dupe.id;
      result.updated += 1;
    } else {
      const { data: inserted, error } = await supabase
        .from("services")
        .insert({
          seller_id: null,
          slug,
          status: publish ? "published" : "pending",
          is_featured: isFeatured,
          featured_until: isFeatured ? new Date(Date.now() + 365 * 864e5).toISOString() : null,
          ...content,
        })
        .select("id")
        .single();
      if (error) { result.errors.push(`${title}: ${error.message}`); result.skipped += 1; continue; }
      serviceId = inserted.id;
      result.created += 1;
    }

    // Re-sync coverage areas + service tags from the sheet.
    await supabase.from("service_areas").delete().eq("service_id", serviceId);
    if (areaIds.length) {
      await supabase.from("service_areas").insert(areaIds.map((lid) => ({ service_id: serviceId, location_id: lid })));
    }
    await supabase.from("listing_services").delete().eq("service_id", serviceId);
    if (categoryIds.length) {
      await supabase.from("listing_services").insert(categoryIds.map((cid) => ({ service_id: serviceId, category_id: cid })));
    }
  }

  return result;
}
