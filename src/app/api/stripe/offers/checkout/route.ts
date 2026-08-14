import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSessionProfile } from "@/lib/auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

// Same commission as the rest of the marketplace, snapshotted onto the order.
const COMMISSION_STANDARD = 0.1;
const COMMISSION_FEATURED = 0.05;

/**
 * Buyer accepts and pays a seller's custom offer. Runs through the same escrow
 * model as every other order: the buyer pays the platform, funds are held until
 * the order is released, then paid out to the seller minus commission.
 * SECURITY-SENSITIVE — human review before enabling live keys.
 */
export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Please sign in to accept.", code: "signin" }, { status: 401 });
  if (!rateLimit(`offer:${clientIp(request)}`, 12, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Payments aren't set up yet." }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as { offerId?: string };
  const offerId = typeof body.offerId === "string" ? body.offerId : "";
  if (!offerId) return NextResponse.json({ error: "Missing offer." }, { status: 400 });

  try {
    const stripe = getStripe();
    const supabase = createSupabaseServiceRoleClient();

    const { data: offer } = await supabase
      .from("custom_offers")
      .select("id, service_id, seller_id, buyer_id, title, price_gbp, revision_limit, status")
      .eq("id", offerId)
      .maybeSingle();
    if (!offer || offer.status !== "sent") {
      return NextResponse.json({ error: "This offer isn't available." }, { status: 400 });
    }
    // Only the buyer the offer was sent to can accept it.
    if (offer.buyer_id !== profile.id) {
      return NextResponse.json({ error: "This offer wasn't sent to you." }, { status: 403 });
    }
    if (offer.price_gbp == null || Number(offer.price_gbp) <= 0) {
      return NextResponse.json({ error: "This offer has no price set." }, { status: 400 });
    }

    const { data: service } = await supabase
      .from("services")
      .select("id, title, slug, seller_id")
      .eq("id", offer.service_id)
      .maybeSingle();
    if (!service || service.seller_id !== offer.seller_id) {
      return NextResponse.json({ error: "This offer's listing is unavailable." }, { status: 400 });
    }

    const { data: seller } = await supabase
      .from("profiles")
      .select("stripe_connect_account_id, payouts_enabled")
      .eq("id", offer.seller_id)
      .maybeSingle();
    if (!seller?.payouts_enabled || !seller.stripe_connect_account_id) {
      return NextResponse.json({ error: "This seller isn't set up for online payments yet." }, { status: 400 });
    }

    const { data: sub } = await supabase
      .from("sponsorships")
      .select("status")
      .eq("seller_id", offer.seller_id)
      .eq("status", "active")
      .maybeSingle();
    const commissionRate = sub ? COMMISSION_FEATURED : COMMISSION_STANDARD;

    const amountGbp = Number(offer.price_gbp);
    const commissionGbp = Math.round(amountGbp * commissionRate * 100) / 100;

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        service_id: service.id,
        seller_id: offer.seller_id,
        buyer_id: profile.id,
        buyer_email: profile.email ?? null,
        amount_gbp: amountGbp,
        commission_rate: commissionRate,
        commission_gbp: commissionGbp,
        currency: "gbp",
        status: "pending",
        revision_limit: offer.revision_limit ?? null,
        custom_offer_id: offer.id,
        transfer_group: null,
      })
      .select("id")
      .single();
    if (orderErr || !order) {
      console.error("[offer-checkout] insert failed", orderErr);
      return NextResponse.json({ error: "Couldn't start the order." }, { status: 500 });
    }

    const transferGroup = `order_${order.id}`;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: profile.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: Math.round(amountGbp * 100),
            product_data: { name: `${offer.title} — ${service.title}` },
          },
        },
      ],
      payment_intent_data: {
        transfer_group: transferGroup,
        metadata: { order_id: order.id },
      },
      metadata: { order_id: order.id },
      success_url: `${siteUrl()}/dashboard/orders?order=success`,
      cancel_url: `${siteUrl()}/dashboard/orders?order=cancel`,
    });

    await supabase
      .from("orders")
      .update({ stripe_checkout_session_id: session.id, transfer_group: transferGroup })
      .eq("id", order.id);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[offer-checkout] failed", err);
    const message = err instanceof Error ? err.message : "Checkout failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
