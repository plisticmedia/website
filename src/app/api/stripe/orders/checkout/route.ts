import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSessionProfile } from "@/lib/auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

// Marketplace commission. Featured members pay the lower rate; snapshotted onto
// the order so later rate changes never touch in-flight purchases.
const COMMISSION_STANDARD = 0.1;
const COMMISSION_FEATURED = 0.05;

/**
 * Starts a Stripe Checkout session for a bookable package (escrow model).
 * The buyer pays the PLATFORM account; funds are held (no transfer_data) until
 * the order is released, then paid out to the seller minus commission.
 * SECURITY-SENSITIVE — human review before enabling live keys.
 */
export async function POST(request: Request) {
  const profile = await getSessionProfile();
  // Buyers must be signed in — needed for order status, refunds and reviews.
  if (!profile) return NextResponse.json({ error: "Please sign in to book.", code: "signin" }, { status: 401 });
  if (!rateLimit(`order:${clientIp(request)}`, 12, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Payments aren't set up yet." }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as { packageId?: string };
  const packageId = typeof body.packageId === "string" ? body.packageId : "";
  if (!packageId) return NextResponse.json({ error: "Missing package." }, { status: 400 });

  try {
    const stripe = getStripe();
    const supabase = createSupabaseServiceRoleClient();

    // Load the package + its parent listing.
    const { data: pkg } = await supabase
      .from("service_packages")
      .select("id, name, price_gbp, is_bookable, service_id")
      .eq("id", packageId)
      .maybeSingle();
    if (!pkg || !pkg.is_bookable) {
      return NextResponse.json({ error: "This package isn't available to book online." }, { status: 400 });
    }
    if (pkg.price_gbp == null || Number(pkg.price_gbp) <= 0) {
      return NextResponse.json({ error: "This package has no price set." }, { status: 400 });
    }

    const { data: service } = await supabase
      .from("services")
      .select("id, title, slug, status, seller_id")
      .eq("id", pkg.service_id)
      .maybeSingle();
    if (!service || service.status !== "published" || !service.seller_id) {
      return NextResponse.json({ error: "This listing isn't available." }, { status: 400 });
    }
    if (service.seller_id === profile.id) {
      return NextResponse.json({ error: "You can't book your own listing." }, { status: 400 });
    }

    // Seller must be able to receive payouts, or we can't release funds later.
    const { data: seller } = await supabase
      .from("profiles")
      .select("stripe_connect_account_id, payouts_enabled")
      .eq("id", service.seller_id)
      .maybeSingle();
    if (!seller?.payouts_enabled || !seller.stripe_connect_account_id) {
      return NextResponse.json({ error: "This seller isn't set up for online payments yet." }, { status: 400 });
    }

    // Commission depends on whether the seller is a featured (paying) member.
    const { data: sub } = await supabase
      .from("sponsorships")
      .select("status")
      .eq("seller_id", service.seller_id)
      .eq("status", "active")
      .maybeSingle();
    const commissionRate = sub ? COMMISSION_FEATURED : COMMISSION_STANDARD;

    const amountGbp = Number(pkg.price_gbp);
    const commissionGbp = Math.round(amountGbp * commissionRate * 100) / 100;

    // Mint the order first so its id can tag the charge (transfer_group).
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        service_id: service.id,
        package_id: pkg.id,
        seller_id: service.seller_id,
        buyer_id: profile.id,
        buyer_email: profile.email ?? null,
        amount_gbp: amountGbp,
        commission_rate: commissionRate,
        commission_gbp: commissionGbp,
        currency: "gbp",
        status: "pending",
        transfer_group: null,
      })
      .select("id")
      .single();
    if (orderErr || !order) {
      console.error("[order-checkout] insert failed", orderErr);
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
            product_data: { name: `${service.title} — ${pkg.name}` },
          },
        },
      ],
      payment_intent_data: {
        transfer_group: transferGroup,
        metadata: { order_id: order.id },
      },
      metadata: { order_id: order.id },
      success_url: `${siteUrl()}/dashboard/orders?order=success`,
      cancel_url: `${siteUrl()}/directory/${service.slug}?order=cancel`,
    });

    await supabase
      .from("orders")
      .update({ stripe_checkout_session_id: session.id, transfer_group: transferGroup })
      .eq("id", order.id);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[order-checkout] failed", err);
    const message = err instanceof Error ? err.message : "Checkout failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
