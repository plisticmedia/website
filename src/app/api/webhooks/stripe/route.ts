import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail, adminEmail, siteUrl } from "@/lib/email";

export const runtime = "nodejs";

type Supabase = ReturnType<typeof createSupabaseServiceRoleClient>;

/**
 * Stripe webhook for the featured subscription. Signature-verified; drives
 * `sponsorships` state and toggles `services.is_featured` for the seller.
 * SECURITY-SENSITIVE — human review before relying on it in production.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const sig = request.headers.get("stripe-signature");
  if (!secret || !sig || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe webhook not configured." }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error("[stripe] bad signature", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const supabase = createSupabaseServiceRoleClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const sub = await getStripe().subscriptions.retrieve(String(session.subscription));
          await syncSubscription(supabase, sub, session.metadata?.seller_id ?? null);
        } else if (session.mode === "payment" && session.metadata?.order_id) {
          await markOrderPaid(supabase, session);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(supabase, event.data.object as Stripe.Subscription);
        break;
      }
      case "account.updated": {
        await syncConnectAccount(supabase, event.data.object as Stripe.Account);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe] handler error", event.type, err);
    return NextResponse.json({ error: "Handler error." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function syncSubscription(supabase: Supabase, sub: Stripe.Subscription, sellerHint?: string | null) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const sellerId =
    (sub.metadata?.seller_id as string | undefined) ||
    sellerHint ||
    (await sellerByCustomer(supabase, customerId));
  if (!sellerId) {
    console.error("[stripe] no seller for subscription", sub.id);
    return;
  }

  const status = mapStatus(sub.status);
  const priceId = sub.items?.data?.[0]?.price?.id ?? null;
  const periodEnd =
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    (sub.items?.data?.[0] as unknown as { current_period_end?: number } | undefined)?.current_period_end;

  await supabase.from("sponsorships").upsert(
    {
      seller_id: sellerId,
      stripe_subscription_id: sub.id,
      stripe_price_id: priceId,
      plan: "featured",
      status,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    },
    { onConflict: "stripe_subscription_id" },
  );

  await featureSeller(supabase, sellerId, status === "active");
}

/**
 * Sync a Connect Express account's onboarding state onto the seller's profile.
 * Drives whether their packages can be booked (payouts_enabled).
 */
async function syncConnectAccount(supabase: Supabase, account: Stripe.Account) {
  await supabase
    .from("profiles")
    .update({
      payouts_enabled: !!account.payouts_enabled,
      charges_enabled: !!account.charges_enabled,
    })
    .eq("stripe_connect_account_id", account.id);
}

/**
 * A buyer's Checkout payment for a bookable package succeeded. Funds are now
 * held on the platform balance (no transfer_data was set). Move the order to
 * in_progress, record the payment intent, and notify both parties. Idempotent:
 * only acts on a still-pending order.
 */
async function markOrderPaid(supabase: Supabase, session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  if (!orderId) return;

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, seller_id, buyer_email, amount_gbp, service_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.status !== "pending") return; // already handled or gone

  await supabase
    .from("orders")
    .update({ status: "in_progress", stripe_payment_intent_id: paymentIntentId })
    .eq("id", orderId)
    .eq("status", "pending");

  await supabase.from("order_events").insert({
    order_id: orderId,
    type: "paid",
    data: { stripe_payment_intent_id: paymentIntentId },
  });

  // Best-effort notifications — never block the webhook.
  const { data: svc } = await supabase.from("services").select("title").eq("id", order.service_id).maybeSingle();
  const title = (svc?.title as string) ?? "your listing";
  const orderUrl = `${siteUrl()}/dashboard/orders`;
  const salesUrl = `${siteUrl()}/dashboard/sales`;

  const buyerEmail = (order.buyer_email as string | null) ?? session.customer_details?.email ?? null;
  if (buyerEmail) {
    void sendEmail({
      to: buyerEmail,
      subject: `Order confirmed — ${title}`,
      text: `Thanks for your booking on Plistic.\n\nYour payment is held securely and released to the supplier once the work is confirmed delivered. Track your order: ${orderUrl}\n\nPlistic holds payment in escrow but is not a party to the work itself.`,
    }).catch(() => {});
  }

  const sellerEmail = await sellerAuthEmail(supabase, order.seller_id as string);
  if (sellerEmail) {
    void sendEmail({
      to: sellerEmail,
      subject: `New booking — ${title}`,
      text: `You have a new paid booking on Plistic. The buyer's payment is held securely; deliver the work then mark it delivered to get paid. View your sales: ${salesUrl}`,
    }).catch(() => {});
  }
  void sendEmail({
    to: adminEmail(),
    subject: `New marketplace order — ${title}`,
    text: `Order ${orderId} paid (£${Number(order.amount_gbp).toFixed(2)}).`,
  }).catch(() => {});
}

/** Look up a seller's login email (lives on the auth user, not profiles). */
async function sellerAuthEmail(supabase: Supabase, sellerId: string): Promise<string | null> {
  try {
    const { data } = await supabase.auth.admin.getUserById(sellerId);
    return data?.user?.email ?? null;
  } catch {
    return null;
  }
}

async function sellerByCustomer(supabase: Supabase, customerId: string): Promise<string | null> {
  const { data } = await supabase.from("profiles").select("id").eq("stripe_customer_id", customerId).maybeSingle();
  return (data?.id as string) ?? null;
}

function mapStatus(s: Stripe.Subscription.Status): "active" | "past_due" | "canceled" {
  if (s === "active" || s === "trialing") return "active";
  if (s === "past_due" || s === "unpaid") return "past_due";
  return "canceled";
}

/**
 * Feature (or un-feature) all of a seller's listings. When un-featuring, admin
 * "trusted" grants (which set a future `featured_until`) are preserved.
 */
async function featureSeller(supabase: Supabase, sellerId: string, on: boolean) {
  if (on) {
    await supabase.from("services").update({ is_featured: true }).eq("seller_id", sellerId);
    return;
  }
  // Un-feature the seller's listings, but keep any admin "trusted" grants (which
  // carry a future featured_until). Two builder calls avoid embedding a
  // timestamp in an .or() filter string.
  await supabase.from("services").update({ is_featured: false }).eq("seller_id", sellerId).is("featured_until", null);
  await supabase
    .from("services")
    .update({ is_featured: false })
    .eq("seller_id", sellerId)
    .lt("featured_until", new Date().toISOString());
}
