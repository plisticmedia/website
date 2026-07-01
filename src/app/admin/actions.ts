"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { geocode, geocodeQuery } from "@/lib/geocode";
import type { ServiceStatus } from "@/lib/types";

/** Admin moderation: publish or remove any listing. RLS admin policy permits this. */
export async function moderateService(id: string, status: ServiceStatus) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("services").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/directory");
}

/**
 * Admin override: grant or revoke "Trusted partner" (featured) status for free.
 * Granting sets is_featured + a 1-year expiry; revoking clears both.
 * (The paid, self-serve version arrives with Stripe in Phase 5; this manual
 * grant is what lets the launch partners be featured at no cost.)
 */
export async function setFeatured(id: string, featured: boolean) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const featuredUntil = featured
    ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    : null;
  const { error } = await supabase
    .from("services")
    .update({ is_featured: featured, featured_until: featuredUntil })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/directory");
}

/**
 * Geocode a small batch of listings that have a location but no coordinates
 * (e.g. imported rows), so they appear on the directory map. Processes a few
 * per click (Nominatim allows ~1 req/sec) — run it a few times for large sets.
 */
export async function geocodeMissing() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("services")
    .select("id, address, postcode, locations!location_id(name)")
    .is("latitude", null)
    .not("location_id", "is", null)
    .limit(6);

  const rows = (data ?? []) as unknown as Array<{
    id: string; address: string | null; postcode: string | null; locations: { name: string } | null;
  }>;

  for (const r of rows) {
    const q = geocodeQuery({ address: r.address, postcode: r.postcode, location: r.locations?.name ?? null });
    if (!q) continue;
    const coords = await geocode(q);
    if (coords) {
      await supabase.from("services").update({ latitude: coords.lat, longitude: coords.lng }).eq("id", r.id);
    }
    await new Promise((res) => setTimeout(res, 1100)); // respect Nominatim rate limit
  }

  revalidatePath("/admin");
  revalidatePath("/directory");
}

/**
 * Clear a wrong/unwanted Google rating from a listing and stop it being
 * auto-matched again (place id set to the "SKIP" sentinel). Use when the
 * automatic match latched onto the wrong business.
 */
export async function clearRating(id: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("services")
    .update({
      google_place_id: "SKIP",
      google_rating: null,
      google_rating_count: null,
      google_rating_updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/directory");
}

/** Re-enable automatic Google matching for a listing previously cleared. */
export async function recheckRating(id: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("services")
    .update({ google_place_id: null, google_rating: null, google_rating_count: null, google_rating_updated_at: null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

// ---------------------------------------------------------------------------
// Claim-a-listing moderation
// ---------------------------------------------------------------------------
export async function approveClaim(claimId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: claim } = await supabase
    .from("claims")
    .select("id, service_id, claimant_user_id")
    .eq("id", claimId)
    .maybeSingle();
  if (!claim) throw new Error("Claim not found.");

  // Assign ownership, then mark the claim approved.
  const { error: ownErr } = await supabase
    .from("services")
    .update({ seller_id: claim.claimant_user_id })
    .eq("id", claim.service_id);
  if (ownErr) throw new Error(ownErr.message);

  const { error } = await supabase.from("claims").update({ status: "approved" }).eq("id", claimId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function rejectClaim(claimId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("claims").update({ status: "rejected" }).eq("id", claimId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

// ---------------------------------------------------------------------------
// Editable taxonomy: service categories + locations (no deploy needed)
// ---------------------------------------------------------------------------
type Taxon = "categories" | "locations";

function taxonSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function str(form: FormData, key: string, max = 120) {
  const v = form.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function createTaxon(kind: Taxon, formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const name = str(formData, "name", 120);
  if (!name) throw new Error("A name is required.");
  const sortRaw = str(formData, "sort_order", 8);
  const sort_order = sortRaw ? parseInt(sortRaw, 10) || 0 : 0;

  const { error } = await supabase
    .from(kind)
    .insert({ name, slug: taxonSlug(name), sort_order });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/taxonomy");
  revalidatePath("/directory");
}

export async function renameTaxon(kind: Taxon, id: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const name = str(formData, "name", 120);
  if (!name) throw new Error("A name is required.");
  const sortRaw = str(formData, "sort_order", 8);
  const update: { name: string; sort_order?: number } = { name };
  if (sortRaw) update.sort_order = parseInt(sortRaw, 10) || 0;

  const { error } = await supabase.from(kind).update(update).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/taxonomy");
  revalidatePath("/directory");
}

export async function deleteTaxon(kind: Taxon, id: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  // FKs are ON DELETE SET NULL / CASCADE, so listings simply lose this tag.
  const { error } = await supabase.from(kind).delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/taxonomy");
  revalidatePath("/directory");
}
