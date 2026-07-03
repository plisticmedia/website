"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail, siteUrl } from "@/lib/email";
import { releaseOrder } from "@/lib/orders";

// Orders are read-only for clients (RLS), so every state change goes through the
// service-role client with an explicit party check here.

/**
 * Seller marks an order delivered. Starts the 14-day buyer-confirmation window;
 * if the buyer doesn't confirm or dispute, the cron auto-releases the funds.
 */
export async function markDelivered(orderId: string) {
  const profile = await requireUser("/dashboard/sales");
  const supabase = createSupabaseServiceRoleClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, seller_id, buyer_email, service_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.seller_id !== profile.id) throw new Error("Order not found.");
  if (order.status !== "in_progress") throw new Error("This order can't be marked delivered.");

  const autoReleaseAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("orders")
    .update({ status: "delivered", delivered_at: new Date().toISOString(), auto_release_at: autoReleaseAt })
    .eq("id", orderId)
    .eq("status", "in_progress");

  await supabase.from("order_events").insert({ order_id: orderId, type: "delivered", data: {} });

  const { data: svc } = await supabase.from("services").select("title").eq("id", order.service_id).maybeSingle();
  const title = (svc?.title as string) ?? "your order";
  if (order.buyer_email) {
    void sendEmail({
      to: order.buyer_email as string,
      subject: `Delivered — please confirm (${title})`,
      text: `The supplier has marked your order as delivered. Please confirm you're happy so they can be paid: ${siteUrl()}/dashboard/orders\n\nIf you do nothing, payment is automatically released after 14 days. If something's wrong, you can raise an issue from your orders page.`,
    }).catch(() => {});
  }

  revalidatePath("/dashboard/sales");
  revalidatePath("/dashboard/orders");
}

/**
 * Buyer confirms the work is complete — releases the held funds to the seller
 * immediately (rather than waiting for auto-release).
 */
export async function confirmReceipt(orderId: string) {
  const profile = await requireUser("/dashboard/orders");
  const supabase = createSupabaseServiceRoleClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, buyer_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.buyer_id !== profile.id) throw new Error("Order not found.");
  if (order.status !== "delivered") throw new Error("This order isn't awaiting confirmation.");

  const res = await releaseOrder(orderId);
  if (!res.ok) throw new Error(res.error ?? "Couldn't release the order.");

  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/sales");
}

/**
 * Buyer leaves a verified review for a completed order. RLS enforces that the
 * order is the buyer's own and completed; the unique order_id blocks duplicates.
 */
export async function leaveReview(orderId: string, formData: FormData) {
  const profile = await requireUser("/dashboard/orders");
  const supabase = await createSupabaseServerClient();

  const rating = Number(formData.get("rating"));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("Please choose a rating from 1 to 5.");
  const bodyRaw = formData.get("body");
  const body = typeof bodyRaw === "string" ? bodyRaw.trim().slice(0, 2000) : "";

  // Read the order (RLS lets the buyer see their own) to get the listing id.
  const { data: order } = await supabase
    .from("orders")
    .select("id, service_id, buyer_id, status")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.buyer_id !== profile.id) throw new Error("Order not found.");
  if (order.status !== "completed") throw new Error("You can review once the order is complete.");

  const { error } = await supabase.from("reviews").insert({
    order_id: orderId,
    service_id: order.service_id,
    buyer_id: profile.id,
    rating,
    body: body || null,
  });
  if (error) throw new Error(error.message);

  const { data: svc } = await supabase.from("services").select("slug").eq("id", order.service_id).maybeSingle();
  revalidatePath("/dashboard/orders");
  if (svc?.slug) revalidatePath(`/directory/${svc.slug}`);
}
