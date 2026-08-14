"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail, siteUrl } from "@/lib/email";

// Custom offers move money once accepted, so — like orders — they're written
// only via the service role here, each with an explicit party check. Actions
// redirect back with a ?msg / ?err banner instead of throwing.

function back(path: string, kind: "msg" | "err", text: string): never {
  redirect(`${path}?${kind}=${encodeURIComponent(text)}`);
}

function str(form: FormData, key: string, max: number): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function intOrNull(form: FormData, key: string): number | null {
  const v = form.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

/**
 * Seller sends a buyer a one-off custom offer, tied to an existing order (so we
 * know exactly which buyer/listing it's for — e.g. covering extra revisions).
 * The buyer accepts + pays from their orders page; nothing is charged here.
 */
export async function sendCustomOffer(parentOrderId: string, formData: FormData) {
  const profile = await requireUser("/dashboard/sales");
  const supabase = createSupabaseServiceRoleClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, seller_id, buyer_id, buyer_email, service_id")
    .eq("id", parentOrderId)
    .maybeSingle();
  if (!order || order.seller_id !== profile.id) back("/dashboard/sales", "err", "Order not found.");

  const title = str(formData, "title", 160);
  if (!title) back("/dashboard/sales", "err", "Give the offer a short title.");

  // The seller chooses: one payment on final approval, or staged milestones.
  // Milestones arrive as a JSON array of { title, amount_gbp } — fully custom,
  // any number of stages. When present, the offer total is their sum.
  const milestones: Array<{ title: string; amount_gbp: number }> = [];
  const milestonesJson = str(formData, "milestones_json", 20000);
  if (milestonesJson) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(milestonesJson);
    } catch {
      back("/dashboard/sales", "err", "Couldn't read the milestones. Please try again.");
    }
    if (!Array.isArray(parsed)) back("/dashboard/sales", "err", "Couldn't read the milestones. Please try again.");
    for (const raw of (parsed as Array<{ title?: unknown; amount_gbp?: unknown }>).slice(0, 12)) {
      const mTitle = typeof raw.title === "string" ? raw.title.trim().slice(0, 160) : "";
      const mAmount = Number(raw.amount_gbp);
      if (!mTitle || !Number.isFinite(mAmount) || mAmount <= 0) {
        back("/dashboard/sales", "err", "Each milestone needs a name and a price above £0.");
      }
      milestones.push({ title: mTitle, amount_gbp: Math.round(mAmount * 100) / 100 });
    }
    if (milestones.length < 1) back("/dashboard/sales", "err", "Add at least one milestone, or switch to a single payment.");
  }

  let price: number;
  if (milestones.length > 0) {
    price = Math.round(milestones.reduce((sum, m) => sum + m.amount_gbp, 0) * 100) / 100;
  } else {
    const priceRaw = formData.get("price_gbp");
    price = typeof priceRaw === "string" ? Number(priceRaw) : NaN;
    if (!Number.isFinite(price) || price <= 0) back("/dashboard/sales", "err", "Set a price above £0 for the offer.");
  }

  const { error } = await supabase.from("custom_offers").insert({
    service_id: order!.service_id,
    seller_id: profile.id,
    buyer_id: order!.buyer_id,
    parent_order_id: order!.id,
    title,
    description: str(formData, "description", 4000) || null,
    price_gbp: Math.round(price * 100) / 100,
    delivery_days: intOrNull(formData, "delivery_days"),
    revision_limit: intOrNull(formData, "revision_limit"),
    milestones: milestones.length > 0 ? milestones : null,
    status: "sent",
  });
  if (error) back("/dashboard/sales", "err", `Couldn't send the offer: ${error.message}`);

  if (order!.buyer_email) {
    void sendEmail({
      to: order!.buyer_email as string,
      subject: `You've got a custom offer — ${title}`,
      text: `The seller has sent you a custom offer on Plistic: "${title}" for £${(Math.round(price * 100) / 100).toFixed(
        2,
      )}.\n\nReview and accept it from your orders: ${siteUrl()}/dashboard/orders\n\nYour payment is held securely and only released once the work is delivered.`,
    }).catch(() => {});
  }

  revalidatePath("/dashboard/sales");
  revalidatePath("/dashboard/orders");
  back("/dashboard/sales", "msg", "Custom offer sent — the buyer can accept and pay from their orders page.");
}

/** Seller withdraws an offer the buyer hasn't accepted yet. */
export async function cancelCustomOffer(offerId: string) {
  const profile = await requireUser("/dashboard/sales");
  const supabase = createSupabaseServiceRoleClient();

  const { data: offer } = await supabase
    .from("custom_offers")
    .select("id, seller_id, status")
    .eq("id", offerId)
    .maybeSingle();
  if (!offer || offer.seller_id !== profile.id) back("/dashboard/sales", "err", "Offer not found.");
  if (offer!.status !== "sent") back("/dashboard/sales", "err", "This offer can no longer be withdrawn.");

  await supabase.from("custom_offers").update({ status: "cancelled" }).eq("id", offerId).eq("status", "sent");
  revalidatePath("/dashboard/sales");
  revalidatePath("/dashboard/orders");
  back("/dashboard/sales", "msg", "Offer withdrawn.");
}

/** Buyer declines an offer. */
export async function declineCustomOffer(offerId: string) {
  const profile = await requireUser("/dashboard/orders");
  const supabase = createSupabaseServiceRoleClient();

  const { data: offer } = await supabase
    .from("custom_offers")
    .select("id, buyer_id, status")
    .eq("id", offerId)
    .maybeSingle();
  if (!offer || offer.buyer_id !== profile.id) back("/dashboard/orders", "err", "Offer not found.");
  if (offer!.status !== "sent") back("/dashboard/orders", "err", "This offer can't be declined.");

  await supabase.from("custom_offers").update({ status: "declined" }).eq("id", offerId).eq("status", "sent");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/sales");
  back("/dashboard/orders", "msg", "Offer declined.");
}
