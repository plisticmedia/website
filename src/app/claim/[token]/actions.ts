"use server";

import { redirect } from "next/navigation";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { sendEmail, adminEmail, siteUrl } from "@/lib/email";

function emailDomain(email: string | null): string | null {
  const d = email?.split("@")[1]?.trim().toLowerCase();
  return d || null;
}
function siteDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Claim an unclaimed listing via its token. Auto-approves when the signed-in
 * user's email domain matches the listing's website domain; otherwise queues a
 * pending claim for admin approval. Records consent + marketing opt-in.
 */
export async function claimListing(token: string, formData: FormData) {
  const profile = await getSessionProfile();
  if (!profile) redirect(`/login?next=${encodeURIComponent(`/claim/${token}`)}`);

  const supabase = createSupabaseServiceRoleClient();
  const { data: svc } = await supabase
    .from("services")
    .select("id, seller_id, website_url, status, title, submitter_email")
    .eq("claim_token", token)
    .maybeSingle();

  if (!svc || svc.status === "removed") redirect(`/claim/${token}?status=removed`);
  if (svc.seller_id) redirect(`/claim/${token}?status=claimed`);

  const marketingOptIn = formData.get("marketing") === "on";
  const email = profile.email?.toLowerCase() ?? null;
  // Auto-approve when the signed-in email matches the listing's website domain
  // OR the email used to submit it (pre-claim for voluntary sign-ups).
  const autoApprove =
    (!!emailDomain(email) && emailDomain(email) === siteDomain(svc.website_url)) ||
    (!!email && !!svc.submitter_email && svc.submitter_email.toLowerCase() === email);

  // Record consent at the moment of claim.
  await supabase
    .from("profiles")
    .update({ marketing_opt_in: marketingOptIn, consent_at: new Date().toISOString() })
    .eq("id", profile.id);

  if (autoApprove) {
    await supabase.from("services").update({ seller_id: profile.id }).eq("id", svc.id);
    await supabase.from("claims").insert({
      service_id: svc.id,
      claimant_user_id: profile.id,
      status: "approved",
      evidence: `Auto-verified: ${profile.email}`,
    });
    if (profile.email) {
      await sendEmail({
        to: profile.email,
        subject: `You now manage ${svc.title} on Plistic`,
        text: `Hi,\n\nYou're now the owner of "${svc.title}" in the Plistic directory. You can edit your profile, add photos and a showreel, and receive enquiries here:\n\n${siteUrl()}/dashboard/listings\n\nThanks,\nPlistic`,
      });
    }
    redirect("/dashboard/listings?claimed=1");
  }

  // No match → pending admin review (skip a duplicate pending claim).
  const { data: existing } = await supabase
    .from("claims")
    .select("id")
    .eq("service_id", svc.id)
    .eq("claimant_user_id", profile.id)
    .eq("status", "pending")
    .maybeSingle();
  if (!existing) {
    await supabase.from("claims").insert({
      service_id: svc.id,
      claimant_user_id: profile.id,
      status: "pending",
      evidence: `Claim via link by ${profile.email}`,
    });
    await sendEmail({
      to: adminEmail(),
      subject: `New claim to review: ${svc.title}`,
      text: `${profile.email} has requested to claim "${svc.title}".\n\nApprove or reject it in the admin dashboard:\n${siteUrl()}/admin`,
    });
  }
  redirect(`/claim/${token}?status=pending`);
}

/** Public one-click opt-out: removes an unclaimed listing from the directory. */
export async function optOut(token: string) {
  const supabase = createSupabaseServiceRoleClient();
  const { data: svc } = await supabase
    .from("services")
    .select("id, seller_id")
    .eq("claim_token", token)
    .maybeSingle();
  // Only unclaimed listings can be removed via the public link.
  if (svc && !svc.seller_id) {
    await supabase.from("services").update({ status: "removed" }).eq("id", svc.id);
  }
  redirect(`/claim/${token}?status=removed`);
}
