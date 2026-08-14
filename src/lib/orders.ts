import "server-only";
import { getStripe } from "@/lib/stripe";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail, siteUrl } from "@/lib/email";

type Supabase = ReturnType<typeof createSupabaseServiceRoleClient>;

/**
 * Release a delivered order's funds to the seller (escrow payout). Transfers the
 * seller's share (amount − commission) from the platform balance to their
 * connected account, records the payout, and completes the order.
 *
 * SECURITY-SENSITIVE (moves money). Only acts on a `delivered` order, so it's
 * safe to call from both buyer-confirmation and the auto-release cron. The
 * unique `order_id` on `payouts` is the backstop against a double transfer.
 */
export async function releaseOrder(orderId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createSupabaseServiceRoleClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, status, seller_id, service_id, amount_gbp, commission_gbp, currency, transfer_group, stripe_payment_intent_id",
    )
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { ok: false, error: "Order not found." };
  if (order.status !== "delivered") return { ok: false, error: "Order is not awaiting release." };

  // Guard against a duplicate payout even if called twice.
  const { data: existingPayout } = await supabase
    .from("payouts")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();
  if (existingPayout) return { ok: false, error: "Already paid out." };

  const { data: seller } = await supabase
    .from("profiles")
    .select("stripe_connect_account_id, payouts_enabled")
    .eq("id", order.seller_id)
    .maybeSingle();
  if (!seller?.stripe_connect_account_id || !seller.payouts_enabled) {
    return { ok: false, error: "Seller can't receive payouts." };
  }

  const payoutGbp = Math.round((Number(order.amount_gbp) - Number(order.commission_gbp)) * 100) / 100;
  const amountPence = Math.round(payoutGbp * 100);

  // Tie the transfer to the original charge via `source_transaction`. Without
  // this, the platform's funds are still settling (pending) right after payment
  // and the transfer fails with "insufficient available balance" — in live mode
  // that settlement delay is days. Linking the charge lets Stripe release the
  // seller's share against that specific payment as it settles.
  let sourceTransaction: string | undefined;
  if (order.stripe_payment_intent_id) {
    try {
      const pi = await getStripe().paymentIntents.retrieve(order.stripe_payment_intent_id as string);
      sourceTransaction = typeof pi.latest_charge === "string" ? pi.latest_charge : pi.latest_charge?.id ?? undefined;
    } catch (err) {
      console.error("[orders] could not resolve charge for transfer", orderId, err);
    }
  }

  let transferId: string;
  try {
    const transfer = await getStripe().transfers.create(
      {
        amount: amountPence,
        currency: (order.currency as string) || "gbp",
        destination: seller.stripe_connect_account_id as string,
        transfer_group: (order.transfer_group as string) || `order_${orderId}`,
        ...(sourceTransaction ? { source_transaction: sourceTransaction } : {}),
        metadata: { order_id: orderId },
      },
      // At-most-once even if buyer-confirm and the auto-release cron race.
      { idempotencyKey: `order_release_${orderId}` },
    );
    transferId = transfer.id;
  } catch (err) {
    console.error("[orders] transfer failed", orderId, err);
    return { ok: false, error: err instanceof Error ? err.message : "Transfer failed." };
  }

  await supabase.from("payouts").insert({
    order_id: orderId,
    seller_id: order.seller_id,
    stripe_transfer_id: transferId,
    amount_gbp: payoutGbp,
    status: "paid",
  });

  await supabase
    .from("orders")
    .update({ status: "completed", released_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("status", "delivered");

  await supabase.from("order_events").insert({
    order_id: orderId,
    type: "released",
    data: { stripe_transfer_id: transferId, amount_gbp: payoutGbp },
  });

  await notifySellerPaid(supabase, order.seller_id as string, order.service_id as string, payoutGbp);
  return { ok: true };
}

/**
 * Auto-release any delivered orders whose buyer-confirmation window has passed
 * and that aren't disputed. Called from the daily cron. Returns how many were
 * released.
 */
export async function sweepAutoReleases(): Promise<{ released: number; failed: number }> {
  const supabase = createSupabaseServiceRoleClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("orders")
    .select("id")
    .eq("status", "delivered")
    .lte("auto_release_at", now)
    .limit(100);

  let released = 0;
  let failed = 0;
  for (const row of (data ?? []) as { id: string }[]) {
    const res = await releaseOrder(row.id);
    if (res.ok) released += 1;
    else failed += 1;
  }
  return { released, failed };
}

/**
 * Release a single approved milestone's funds to the seller (partial escrow
 * release). The buyer's original charge covers every milestone, so each release
 * is a transfer tied to that charge via `source_transaction`. Completes the
 * parent order once all its milestones are released.
 *
 * SECURITY-SENSITIVE (moves money). Only acts on a `delivered` milestone whose
 * parent order isn't disputed. The unique `milestone_id` on `payouts` and the
 * per-milestone idempotency key are the backstops against a double transfer.
 */
export async function releaseMilestone(milestoneId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createSupabaseServiceRoleClient();

  const { data: ms } = await supabase
    .from("order_milestones")
    .select("id, order_id, amount_gbp, commission_gbp, status, stripe_transfer_id")
    .eq("id", milestoneId)
    .maybeSingle();
  if (!ms) return { ok: false, error: "Milestone not found." };
  if (ms.status !== "delivered" || ms.stripe_transfer_id) {
    return { ok: false, error: "This stage isn't awaiting release." };
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, seller_id, service_id, currency, transfer_group, stripe_payment_intent_id")
    .eq("id", ms.order_id)
    .maybeSingle();
  if (!order) return { ok: false, error: "Order not found." };
  if (order.status === "disputed") return { ok: false, error: "Order is under dispute." };

  // Backstop against a duplicate payout for this milestone.
  const { data: existingPayout } = await supabase
    .from("payouts")
    .select("id")
    .eq("milestone_id", milestoneId)
    .maybeSingle();
  if (existingPayout) return { ok: false, error: "Already paid out." };

  const { data: seller } = await supabase
    .from("profiles")
    .select("stripe_connect_account_id, payouts_enabled")
    .eq("id", order.seller_id)
    .maybeSingle();
  if (!seller?.stripe_connect_account_id || !seller.payouts_enabled) {
    return { ok: false, error: "Seller can't receive payouts." };
  }

  const payoutGbp = Math.round((Number(ms.amount_gbp) - Number(ms.commission_gbp)) * 100) / 100;
  const amountPence = Math.round(payoutGbp * 100);

  let sourceTransaction: string | undefined;
  if (order.stripe_payment_intent_id) {
    try {
      const pi = await getStripe().paymentIntents.retrieve(order.stripe_payment_intent_id as string);
      sourceTransaction = typeof pi.latest_charge === "string" ? pi.latest_charge : pi.latest_charge?.id ?? undefined;
    } catch (err) {
      console.error("[orders] could not resolve charge for milestone transfer", milestoneId, err);
    }
  }

  let transferId: string;
  try {
    const transfer = await getStripe().transfers.create(
      {
        amount: amountPence,
        currency: (order.currency as string) || "gbp",
        destination: seller.stripe_connect_account_id as string,
        transfer_group: (order.transfer_group as string) || `order_${order.id}`,
        ...(sourceTransaction ? { source_transaction: sourceTransaction } : {}),
        metadata: { order_id: order.id, milestone_id: milestoneId },
      },
      { idempotencyKey: `milestone_release_${milestoneId}` },
    );
    transferId = transfer.id;
  } catch (err) {
    console.error("[orders] milestone transfer failed", milestoneId, err);
    return { ok: false, error: err instanceof Error ? err.message : "Transfer failed." };
  }

  await supabase
    .from("order_milestones")
    .update({ status: "released", released_at: new Date().toISOString(), stripe_transfer_id: transferId })
    .eq("id", milestoneId)
    .eq("status", "delivered");

  await supabase.from("payouts").insert({
    order_id: order.id,
    milestone_id: milestoneId,
    seller_id: order.seller_id,
    stripe_transfer_id: transferId,
    amount_gbp: payoutGbp,
    status: "paid",
  });

  await supabase.from("order_events").insert({
    order_id: order.id,
    type: "milestone_released",
    data: { milestone_id: milestoneId, stripe_transfer_id: transferId, amount_gbp: payoutGbp },
  });

  // Complete the order once every milestone is released.
  const { data: remaining } = await supabase
    .from("order_milestones")
    .select("id")
    .eq("order_id", order.id)
    .neq("status", "released")
    .limit(1);
  if (!remaining || remaining.length === 0) {
    await supabase
      .from("orders")
      .update({ status: "completed", released_at: new Date().toISOString() })
      .eq("id", order.id)
      .neq("status", "completed");
    await supabase.from("order_events").insert({ order_id: order.id, type: "released", data: { via: "milestones" } });
  }

  await notifySellerPaid(supabase, order.seller_id as string, order.service_id as string, payoutGbp);
  return { ok: true };
}

/**
 * Auto-release milestones the buyer left approved-by-inaction: delivered, past
 * their window, on a non-disputed order. Called from the daily cron.
 */
export async function sweepMilestoneAutoReleases(): Promise<{ released: number; failed: number }> {
  const supabase = createSupabaseServiceRoleClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("order_milestones")
    .select("id, orders!inner ( status )")
    .eq("status", "delivered")
    .lte("auto_release_at", now)
    .neq("orders.status", "disputed")
    .limit(100);

  let released = 0;
  let failed = 0;
  for (const row of (data ?? []) as { id: string }[]) {
    const res = await releaseMilestone(row.id);
    if (res.ok) released += 1;
    else failed += 1;
  }
  return { released, failed };
}

async function notifySellerPaid(supabase: Supabase, sellerId: string, serviceId: string, payoutGbp: number) {
  try {
    const { data: svc } = await supabase.from("services").select("title").eq("id", serviceId).maybeSingle();
    const title = (svc?.title as string) ?? "your listing";
    const { data: user } = await supabase.auth.admin.getUserById(sellerId);
    const email = user?.user?.email;
    if (!email) return;
    void sendEmail({
      to: email,
      subject: `You've been paid — ${title}`,
      text: `An order on Plistic has been released. £${payoutGbp.toFixed(
        2,
      )} is on its way to your bank account via Stripe. View your sales: ${siteUrl()}/dashboard/sales`,
    }).catch(() => {});
  } catch {
    /* notification is best-effort */
  }
}
