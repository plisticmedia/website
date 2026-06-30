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
