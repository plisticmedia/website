#!/usr/bin/env node
/**
 * Plistic directory — bulk import listings from a CSV export of the sign-up sheet.
 *
 * Usage:
 *   1. Export the Google Sheet as CSV (File → Download → CSV).
 *   2. Provide credentials (do NOT commit them):
 *        export NEXT_PUBLIC_SUPABASE_URL="https://<ref>.supabase.co"
 *        export SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."
 *   3. Run:
 *        node scripts/import-listings.mjs path/to/listings.csv
 *      Add --publish to publish rows immediately (default: 'pending' for review).
 *
 * Column headers are matched case-insensitively and flexibly. Recognised:
 *   name/business            -> title (required)
 *   services/service/category-> services (split on , ; or |) -> service tags
 *   description/summary/about -> summary + description
 *   location/area/region     -> location (matched/created)
 *   website/url/site         -> website_url
 *   logo                     -> logo_url
 *   address                  -> address
 *   postcode/post code       -> postcode
 *   instagram / linkedin / facebook / x / twitter / tiktok -> social_links
 *   founding/trusted/partner -> is_featured (truthy)
 *
 * Idempotent: a row whose slug already exists is skipped.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const csvPath = process.argv[2];
const publish = process.argv.includes("--publish");

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}
if (!csvPath) {
  console.error("Usage: node scripts/import-listings.mjs <listings.csv> [--publish]");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

// --- tiny CSV parser (handles quotes, commas, newlines in quoted fields) -----
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; }
        else inQuotes = false;
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

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}
function norm(h) {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}
function pick(rowObj, keys) {
  for (const k of keys) {
    const v = rowObj[k];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

async function ensureTaxon(table, name) {
  const slug = slugify(name);
  if (!slug) return null;
  const { data: existing } = await supabase.from(table).select("id").eq("slug", slug).maybeSingle();
  if (existing?.id) return existing.id;
  const { data, error } = await supabase.from(table).insert({ name, slug, sort_order: 500 }).select("id").single();
  if (error) { console.warn(`  ! could not create ${table} "${name}": ${error.message}`); return null; }
  return data.id;
}

const raw = readFileSync(csvPath, "utf8");
const matrix = parseCsv(raw);
if (matrix.length < 2) { console.error("CSV has no data rows."); process.exit(1); }

const headers = matrix[0].map(norm);
let created = 0, skipped = 0;

for (const cells of matrix.slice(1)) {
  const r = {};
  headers.forEach((h, i) => { r[h] = cells[i] ?? ""; });

  const title = pick(r, ["name", "businessname", "business", "company", "studio"]);
  if (!title) { skipped += 1; continue; }
  const slug = slugify(title);

  const { data: dupe } = await supabase.from("services").select("id").eq("slug", slug).maybeSingle();
  if (dupe?.id) { console.log(`= skip (exists): ${title}`); skipped += 1; continue; }

  const servicesRaw = pick(r, ["services", "service", "category", "categories", "discipline"]);
  const serviceNames = servicesRaw.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
  const description = pick(r, ["description", "about", "bio", "summary"]);
  const summary = pick(r, ["summary", "tagline"]) || description.slice(0, 280);
  const locationName = pick(r, ["location", "area", "region", "city", "town"]);
  const website = pick(r, ["website", "url", "site", "weblink"]);
  const logo = pick(r, ["logo", "logourl", "logolink"]);
  const address = pick(r, ["address", "streetaddress"]);
  const postcode = pick(r, ["postcode", "postalcode", "zip"]);
  const partnerFlag = pick(r, ["founding", "foundingpartner", "trusted", "trustedpartner", "partner", "featured"]);
  const isFeatured = /^(y|yes|true|1)/i.test(partnerFlag);

  const social = {};
  for (const net of ["instagram", "linkedin", "facebook", "tiktok", "x", "twitter", "youtube"]) {
    const v = pick(r, [net]);
    if (v) social[net === "x" ? "twitter" : net] = v;
  }

  const categoryIds = [];
  for (const name of serviceNames) {
    const id = await ensureTaxon("categories", name);
    if (id) categoryIds.push(id);
  }
  const locationId = locationName ? await ensureTaxon("locations", locationName) : null;

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
      address: address || null,
      postcode: postcode || null,
      social_links: social,
      status: publish ? "published" : "pending",
      is_featured: isFeatured,
      featured_until: isFeatured ? new Date(Date.now() + 365 * 864e5).toISOString() : null,
    })
    .select("id")
    .single();

  if (error) { console.warn(`! failed: ${title} — ${error.message}`); skipped += 1; continue; }

  if (categoryIds.length) {
    await supabase.from("listing_services").insert(
      categoryIds.map((cid) => ({ service_id: inserted.id, category_id: cid })),
    );
  }
  console.log(`+ ${publish ? "published" : "pending"}: ${title}`);
  created += 1;
}

console.log(`\nDone. Created ${created}, skipped ${skipped}.`);
