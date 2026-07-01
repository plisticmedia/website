"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";

/**
 * A logged-in business owner requests to claim an unowned (imported) listing.
 * Creates a pending claim; an admin verifies and approves it (which assigns
 * ownership). See src/app/admin/actions.ts approveClaim/rejectClaim.
 */
export async function requestClaim(serviceId: string, slug: string, formData: FormData) {
  const profile = await getSessionProfile();
  if (!profile) redirect(`/login?next=${encodeURIComponent(`/directory/${slug}`)}`);

  const supabase = await createSupabaseServerClient();

  const { data: svc } = await supabase
    .from("services")
    .select("id, seller_id")
    .eq("id", serviceId)
    .maybeSingle();
  if (!svc || svc.seller_id) {
    throw new Error("This listing is not available to claim.");
  }

  // Avoid duplicate pending claims from the same user.
  const { data: existing } = await supabase
    .from("claims")
    .select("id")
    .eq("service_id", serviceId)
    .eq("claimant_user_id", profile.id)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) {
    revalidatePath(`/directory/${slug}`);
    return;
  }

  const evidenceRaw = formData.get("evidence");
  const evidence = typeof evidenceRaw === "string" ? evidenceRaw.trim().slice(0, 1000) : "";

  const { error } = await supabase.from("claims").insert({
    service_id: serviceId,
    claimant_user_id: profile.id,
    evidence: evidence || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/directory/${slug}`);
}
