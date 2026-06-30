"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
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
