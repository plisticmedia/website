"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { sendEmail, adminEmail, siteUrl } from "@/lib/email";

type Svc = ReturnType<typeof createSupabaseServiceRoleClient>;

async function ownsService(svc: Svc, sellerId: string, serviceId: string): Promise<boolean> {
  const { data } = await svc.from("services").select("id").eq("id", serviceId).eq("seller_id", sellerId).maybeSingle();
  return !!data;
}

/** Declare that one of my listings has worked with another business (pending until they confirm). */
export async function addCollaboration(formData: FormData) {
  const profile = await requireUser("/dashboard/network");
  const myServiceId = String(formData.get("myServiceId") ?? "");
  const peerServiceId = String(formData.get("peerServiceId") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 300) || null;
  if (!myServiceId || !peerServiceId || myServiceId === peerServiceId) return;

  const svc = createSupabaseServiceRoleClient();
  if (!(await ownsService(svc, profile.id, myServiceId))) throw new Error("That isn't your listing.");

  const { data: peer } = await svc.from("services").select("id, seller_id, status").eq("id", peerServiceId).maybeSingle();
  if (!peer || peer.status !== "published" || peer.seller_id === profile.id) throw new Error("Pick a valid business.");

  // Skip if a link already exists in either direction.
  const { data: existing } = await svc
    .from("peer_connections")
    .select("id")
    .or(
      `and(requester_service_id.eq.${myServiceId},peer_service_id.eq.${peerServiceId}),` +
        `and(requester_service_id.eq.${peerServiceId},peer_service_id.eq.${myServiceId})`,
    )
    .maybeSingle();
  if (!existing) {
    await svc.from("peer_connections").insert({
      requester_service_id: myServiceId,
      peer_service_id: peerServiceId,
      note,
      status: "pending",
    });
  }
  revalidatePath("/dashboard/network");
}

/** Confirm an incoming collaboration request (I own the peer side). */
export async function confirmCollaboration(connectionId: string) {
  const profile = await requireUser("/dashboard/network");
  const svc = createSupabaseServiceRoleClient();
  const { data: conn } = await svc
    .from("peer_connections")
    .select("id, peer_service_id, status")
    .eq("id", connectionId)
    .maybeSingle();
  if (!conn || conn.status !== "pending") throw new Error("Not found.");
  if (!(await ownsService(svc, profile.id, conn.peer_service_id as string))) throw new Error("Not yours to confirm.");
  await svc
    .from("peer_connections")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("id", connectionId);
  revalidatePath("/dashboard/network");
}

/** Decline an incoming request (I own the peer side). */
export async function declineCollaboration(connectionId: string) {
  const profile = await requireUser("/dashboard/network");
  const svc = createSupabaseServiceRoleClient();
  const { data: conn } = await svc
    .from("peer_connections")
    .select("id, peer_service_id, status")
    .eq("id", connectionId)
    .maybeSingle();
  if (!conn || conn.status !== "pending") throw new Error("Not found.");
  if (!(await ownsService(svc, profile.id, conn.peer_service_id as string))) throw new Error("Not yours.");
  await svc.from("peer_connections").update({ status: "declined" }).eq("id", connectionId);
  revalidatePath("/dashboard/network");
}

/** Remove a link (either party can). */
export async function removeCollaboration(connectionId: string) {
  const profile = await requireUser("/dashboard/network");
  const svc = createSupabaseServiceRoleClient();
  const { data: conn } = await svc
    .from("peer_connections")
    .select("id, requester_service_id, peer_service_id")
    .eq("id", connectionId)
    .maybeSingle();
  if (!conn) return;
  const owns =
    (await ownsService(svc, profile.id, conn.requester_service_id as string)) ||
    (await ownsService(svc, profile.id, conn.peer_service_id as string));
  if (!owns) throw new Error("Not yours.");
  await svc.from("peer_connections").delete().eq("id", connectionId);
  revalidatePath("/dashboard/network");
}

/** The business's public right-of-reply to its peer-confidence aggregate. */
export async function savePeerReply(formData: FormData) {
  const profile = await requireUser("/dashboard/network");
  const myServiceId = String(formData.get("myServiceId") ?? "");
  const reply = String(formData.get("reply") ?? "").trim().slice(0, 500) || null;
  const svc = createSupabaseServiceRoleClient();
  if (!(await ownsService(svc, profile.id, myServiceId))) throw new Error("That isn't your listing.");
  await svc.from("services").update({ peer_reply: reply }).eq("id", myServiceId);
  revalidatePath("/dashboard/network");
}

/** Flag the peer-confidence aggregate for admin review (dispute). */
export async function disputePeerConfidence(myServiceId: string) {
  const profile = await requireUser("/dashboard/network");
  const svc = createSupabaseServiceRoleClient();
  if (!(await ownsService(svc, profile.id, myServiceId))) throw new Error("That isn't your listing.");
  await svc.from("services").update({ peer_confidence_disputed_at: new Date().toISOString() }).eq("id", myServiceId);
  const { data: s } = await svc.from("services").select("title").eq("id", myServiceId).maybeSingle();
  await sendEmail({
    to: adminEmail(),
    subject: `Peer confidence disputed: ${(s as { title?: string } | null)?.title ?? myServiceId}`,
    text: `A business has disputed its peer-confidence score.\n\nReview it in the admin dashboard and hide the score if appropriate:\n${siteUrl()}/admin`,
  });
  revalidatePath("/dashboard/network");
}

/**
 * Private, structured feedback about working with a confirmed collaborator.
 * Only allowed between businesses with a confirmed connection. Never shown
 * publicly (RLS restricts reads to the rater and admins).
 */
export async function submitPeerFeedback(formData: FormData) {
  const profile = await requireUser("/dashboard/network");
  const raterServiceId = String(formData.get("raterServiceId") ?? "");
  const subjectServiceId = String(formData.get("subjectServiceId") ?? "");
  const wouldWorkAgain = String(formData.get("wouldWorkAgain") ?? "");
  if (!["yes", "mixed", "no"].includes(wouldWorkAgain)) throw new Error("Please choose an answer.");

  const svc = createSupabaseServiceRoleClient();
  if (!(await ownsService(svc, profile.id, raterServiceId))) throw new Error("That isn't your listing.");

  // A confirmed collaboration must exist between the two listings.
  const { data: link } = await svc
    .from("peer_connections")
    .select("id")
    .eq("status", "confirmed")
    .or(
      `and(requester_service_id.eq.${raterServiceId},peer_service_id.eq.${subjectServiceId}),` +
        `and(requester_service_id.eq.${subjectServiceId},peer_service_id.eq.${raterServiceId})`,
    )
    .maybeSingle();
  if (!link) throw new Error("You can only leave feedback for a confirmed collaborator.");

  const num = (k: string) => {
    const v = Number(formData.get(k));
    return Number.isInteger(v) && v >= 1 && v <= 5 ? v : null;
  };
  await svc.from("peer_feedback").upsert(
    {
      rater_service_id: raterServiceId,
      subject_service_id: subjectServiceId,
      would_work_again: wouldWorkAgain,
      reliability: num("reliability"),
      communication: num("communication"),
      quality: num("quality"),
      private_note: String(formData.get("privateNote") ?? "").trim().slice(0, 2000) || null,
    },
    { onConflict: "rater_service_id,subject_service_id" },
  );
  revalidatePath("/dashboard/network");
}
