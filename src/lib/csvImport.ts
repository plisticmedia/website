import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Strip a leading UTF-8 byte-order mark (Excel adds one to CSV exports). */
export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/**
 * Guess the column delimiter from the header line. Excel in some locales exports
 * semicolon-separated files; pasted/exported data is sometimes tab-separated.
 * Falls back to comma.
 */
export function detectDelimiter(headerLine: string): string {
  const counts: Array<[string, number]> = [
    [",", (headerLine.match(/,/g) || []).length],
    [";", (headerLine.match(/;/g) || []).length],
    ["\t", (headerLine.match(/\t/g) || []).length],
  ];
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ",";
}

/** Minimal CSV parser: handles quotes, escaped quotes, the given delimiter and newlines. */
export function parseCsv(text: string, delimiter = ","): string[][] {
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
    else if (c === delimiter) { row.push(field); field = ""; }
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

// Every header we recognise as the business/listing name. Broad on purpose so a
// research spreadsheet doesn't get silently skipped for an unexpected column name.
const TITLE_KEYS = [
  "name", "businessname", "business", "company", "companyname", "studio", "brand", "agency",
  "organisation", "organization", "organisationname", "organizationname",
  "tradingname", "listingname", "listing", "provider", "supplier",
  "companyorindividualname", "companyorindividual", "individualorcompanyname",
  "nameofbusiness", "nameofcompany", "nameofyourbusiness", "businessorindividual",
  "fullname", "contactname", "yourname",
];

const LOGO_KEYS = [
  "logo", "logourl", "logolink", "logoimage", "logoorprofileimage", "profileimage",
  "brandimage", "brandlogo", "image", "imageurl", "picture", "photo",
];

/** Extract the listing title, falling back to the first non-empty cell. */
function deriveTitle(
  r: Record<string, string>,
  headers: string[],
  cells: string[],
): { title: string; usedFallback: boolean } {
  const known = pick(r, TITLE_KEYS);
  if (known) return { title: known, usedFallback: false };
  // Fallback: first non-empty cell that isn't obviously a URL/email/number. This
  // rescues CSVs whose name column has an unrecognised header.
  for (const cell of cells) {
    const v = (cell ?? "").trim();
    if (!v) continue;
    if (/^https?:\/\//i.test(v)) continue;
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) continue;
    if (/^[\d\s.,+()-]+$/.test(v)) continue;
    if (/[a-z]/i.test(v)) return { title: v.slice(0, 140), usedFallback: true };
  }
  void headers;
  return { title: "", usedFallback: false };
}

function consentSaysNo(r: Record<string, string>): boolean {
  const consent = pick(r, [
    "imhappyforthedetailsabovetobepublishedinthescotlandmediadirectory", "consent", "publish",
    "consenttopublish", "happytobelisted",
  ]);
  return !!consent && /^(n|no|false|0)/i.test(consent);
}

async function ensureTaxon(supabase: SupabaseClient, table: "categories" | "locations", name: string) {
  const slug = slugify(name);
  if (!slug) return null;
  const { data: existing } = await supabase.from(table).select("id").eq("slug", slug).maybeSingle();
  if (existing?.id) return existing.id as string;
  const { data } = await supabase.from(table).insert({ name, slug, sort_order: 500 }).select("id").single();
  return (data?.id as string) ?? null;
}

export type SkippedRow = { row: number; name: string; reason: string };
export type ImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  skippedRows: SkippedRow[];
  headers: string[];
  delimiter: string;
  dataRows: number;
  usedNameFallback: boolean;
  dryRun: boolean;
};

/** Human-readable delimiter name for reporting. */
function delimiterName(d: string): string {
  return d === "\t" ? "tab" : d === ";" ? "semicolon" : "comma";
}

/**
 * Parse a CSV without touching the database and report what WOULD be imported.
 * Used by the admin "Preview" button and unit tests. Explains every skip.
 */
export function previewCsv(csvText: string): {
  delimiter: string;
  delimiterName: string;
  headers: string[];
  dataRows: number;
  wouldImport: { row: number; title: string; usedFallback: boolean }[];
  skippedRows: SkippedRow[];
  usedNameFallback: boolean;
} {
  const text = stripBom(csvText ?? "");
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = detectDelimiter(firstLine);
  const matrix = parseCsv(text, delimiter);
  const wouldImport: { row: number; title: string; usedFallback: boolean }[] = [];
  const skippedRows: SkippedRow[] = [];
  let usedNameFallback = false;

  if (matrix.length < 2) {
    return {
      delimiter,
      delimiterName: delimiterName(delimiter),
      headers: matrix[0]?.map((h) => h.trim()) ?? [],
      dataRows: 0,
      wouldImport,
      skippedRows: [{ row: 0, name: "", reason: "CSV had no data rows (need a header row plus at least one row)." }],
      usedNameFallback,
    };
  }
  const rawHeaders = matrix[0].map((h) => h.trim());
  const headers = matrix[0].map(norm);

  matrix.slice(1).forEach((cells, idx) => {
    const rowNum = idx + 2; // 1-based, +1 for header
    const r: Record<string, string> = {};
    headers.forEach((h, i) => { r[h] = cells[i] ?? ""; });
    const { title, usedFallback } = deriveTitle(r, headers, cells);
    if (!title) {
      skippedRows.push({ row: rowNum, name: "", reason: "No business name found in any recognised column or the first column." });
      return;
    }
    if (usedFallback) usedNameFallback = true;
    if (consentSaysNo(r)) {
      skippedRows.push({ row: rowNum, name: title, reason: "Consent-to-publish column said no." });
      return;
    }
    wouldImport.push({ row: rowNum, title, usedFallback });
  });

  return {
    delimiter,
    delimiterName: delimiterName(delimiter),
    headers: rawHeaders,
    dataRows: matrix.length - 1,
    wouldImport,
    skippedRows,
    usedNameFallback,
  };
}

/** Import listings from raw CSV text using a service-role client. */
export async function importListingsFromCsv(
  supabase: SupabaseClient,
  csvText: string,
  publish: boolean,
  source?: string,
  opts?: { dryRun?: boolean },
): Promise<ImportResult> {
  const dryRun = !!opts?.dryRun;
  const text = stripBom(csvText ?? "");
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = detectDelimiter(firstLine);
  const matrix = parseCsv(text, delimiter);

  const result: ImportResult = {
    created: 0, updated: 0, skipped: 0, errors: [], skippedRows: [],
    headers: [], delimiter: delimiterName(delimiter), dataRows: Math.max(0, matrix.length - 1),
    usedNameFallback: false, dryRun,
  };
  if (matrix.length < 2) {
    result.errors.push("CSV had no data rows (need a header row plus at least one row).");
    return result;
  }
  result.headers = matrix[0].map((h) => h.trim());
  const headers = matrix[0].map(norm);

  let rowNum = 1;
  for (const cells of matrix.slice(1)) {
    rowNum += 1;
    const r: Record<string, string> = {};
    headers.forEach((h, i) => { r[h] = cells[i] ?? ""; });

    const { title, usedFallback } = deriveTitle(r, headers, cells);
    if (!title) {
      result.skipped += 1;
      result.skippedRows.push({ row: rowNum, name: "", reason: "No business name found in any recognised column or the first column." });
      continue;
    }
    if (usedFallback) result.usedNameFallback = true;
    const slug = slugify(title);

    if (consentSaysNo(r)) {
      result.skipped += 1;
      result.skippedRows.push({ row: rowNum, name: title, reason: "Consent-to-publish column said no." });
      continue;
    }

    // A listing may already exist. Update owner-less (imported) ones from the
    // sheet; never overwrite a listing a seller has claimed.
    const { data: dupe } = await supabase
      .from("services")
      .select("id, seller_id, claim_token")
      .eq("slug", slug)
      .maybeSingle();
    if (dupe?.id && dupe.seller_id) {
      result.skipped += 1;
      result.skippedRows.push({ row: rowNum, name: title, reason: "A claimed listing with this name already exists (left untouched)." });
      continue;
    }
    // Stable per-listing claim link (kept on re-import).
    const claimToken = (dupe as { claim_token?: string | null } | null)?.claim_token ?? randomUUID().replace(/-/g, "");

    const serviceNames = [
      pick(r, ["services", "service", "category", "categories", "discipline", "disciplines", "whatcategorybestdescribesyourservices", "whatdoyoudo"]),
      pick(r, ["ifyouselectedotherpleasetelluswhatyoudo", "other"]),
    ]
      .filter(Boolean)
      .join(",")
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const shortDesc = pick(r, ["ashortdescriptionofyourcompanyandwhatyoudo", "description", "about", "bio", "summary", "overview"]);
    const longDesc = pick(r, ["tellusmoreaboutyourbusiness", "moreinfo", "details"]);
    const summary = (pick(r, ["summary", "tagline"]) || shortDesc || title).slice(0, 280);
    const description = [shortDesc, longDesc].filter(Boolean).join("\n\n") || shortDesc || null;
    // Base location -> map pin + shown publicly (geocoded from address/postcode/town).
    const explicitAddress = pick(r, ["businessaddress", "address", "streetaddress"]);
    const baseText = pick(r, ["whereisyourcompanybased", "basedin", "location", "city", "town", "basedlocation"]);
    const postcode = pick(r, ["postcode", "postalcode", "zip"]);
    // Operating areas -> coverage (Location filter + density). Split multi-values.
    const operatesText = pick(r, [
      "wheredoesyourbusinessoperate", "whichareasofscotlanddoyouworkin", "whichareasdoyouworkin",
      "areasyouworkin", "areasyoucover", "areasyouoperatein", "operates", "coverage", "area", "areas", "region", "regions",
    ]);
    const areaNames = (operatesText || baseText)
      .split(/[,;|/]|\band\b/i)
      .map((s) => s.trim())
      .filter(Boolean);
    const website = pick(r, ["website", "url", "site", "weblink", "websiteurl", "web"]);
    const logo = pick(r, LOGO_KEYS);
    const partnerFlag = pick(r, ["founding", "foundingpartner", "trusted", "trustedpartner", "partner", "featured"]);
    const isFeatured = /^(y|yes|true|1)/i.test(partnerFlag);
    // Public contact email — stored as submitter_email so we can email a claim
    // invite, and so the business auto-owns its page when it claims with that email.
    const emailRaw = pick(r, ["publicemail", "email", "contactemail", "emailaddress", "businessemail", "publicemailaddress", "contact"]).toLowerCase();
    const submitterEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw) ? emailRaw : "";

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

    if (dryRun) {
      // Report what would happen without writing anything.
      if (dupe?.id) result.updated += 1;
      else result.created += 1;
      continue;
    }

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
      claim_token: claimToken,
      ...(submitterEmail ? { submitter_email: submitterEmail } : {}),
      ...(source ? { source } : {}),
      // Only set the Google place when the profile link contained a real id;
      // never wipe an existing match on re-import.
      ...(placeIdFromUrl ? { google_place_id: placeIdFromUrl } : {}),
      // Re-geocode next time the admin runs the map tool.
      latitude: null,
      longitude: null,
    };

    let serviceId: string;
    if (dupe?.id) {
      // Non-destructive update: only overwrite fields the sheet actually
      // provides, so a re-import (e.g. to add emails) never wipes enrichment
      // added afterwards — logos, geocoded coordinates, ratings.
      const upd: Record<string, unknown> = { title, claim_token: claimToken };
      if (summary) upd.summary = summary;
      if (description) upd.description = description;
      if (categoryIds[0]) upd.category_id = categoryIds[0];
      if (areaIds[0]) upd.location_id = areaIds[0];
      if (website) upd.website_url = website;
      if (logo) { upd.logo_url = logo; upd.cover_image_url = logo; }
      if (explicitAddress || baseText) upd.address = explicitAddress || baseText;
      if (postcode) upd.postcode = postcode;
      if (Object.keys(social).length) upd.social_links = social;
      if (submitterEmail) upd.submitter_email = submitterEmail;
      if (source) upd.source = source;
      if (placeIdFromUrl) upd.google_place_id = placeIdFromUrl;

      const { error } = await supabase.from("services").update(upd).eq("id", dupe.id);
      if (error) {
        result.errors.push(`Row ${rowNum} (${title}): ${error.message}`);
        result.skipped += 1;
        result.skippedRows.push({ row: rowNum, name: title, reason: `Database error: ${error.message}` });
        continue;
      }
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
      if (error) {
        result.errors.push(`Row ${rowNum} (${title}): ${error.message}`);
        result.skipped += 1;
        result.skippedRows.push({ row: rowNum, name: title, reason: `Database error: ${error.message}` });
        continue;
      }
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
