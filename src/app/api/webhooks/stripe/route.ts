import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

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
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(supabase, event.data.object as Stripe.Subscription);
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
