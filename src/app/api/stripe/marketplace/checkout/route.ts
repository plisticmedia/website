import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSessionProfile } from "@/lib/auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

// Same marketplace commission as bookable packages. Snapshotted onto the order.
const COMMISSION_STANDARD = 0.1;
const COMMISSION_FEATURED = 0.05;
const MAX_QTY = 50;

/**
 * Starts a Stripe Checkout session to buy a marketplace item (product) — a
 * physical good or a fixed service — under the same escrow model as bookable
 * packages. The buyer pays the PLATFORM account; funds are held (no
 * transfer_data) until the order is released, then paid out to the seller minus
 * commission. Physical goods collect a shipping address at checkout.
 * SECURITY-SENSITIVE — human review before enabling live keys.
 */
export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Please sign in to buy.", code: "signin" }, { status: 401 });
  if (!rateLimit(`mkt:${clientIp(request)}`, 12, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Payments aren't set up yet." }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as { productId?: string; quantity?: number };
  const productId = typeof body.productId === "string" ? body.productId : "";
  let quantity = Number.isFinite(body.quantity) ? Math.floor(Number(body.quantity)) : 1;
  if (quantity < 1) quantity = 1;
  if (quantity > MAX_QTY) quantity = MAX_QTY;
  if (!productId) return NextResponse.json({ error: "Missing item." }, { status: 400 });

  try {
    const stripe = getStripe();
    const supabase = createSupabaseServiceRoleClient();

    // Load the item + its parent listing.
    const { data: product } = await supabase
      .from("products")
      .select("id, title, price_gbp, product_type, status, stock, fulfilment, revision_limit, service_id")
      .eq("id", productId)
      .maybeSingle();
    if (!product || product.status !== "active") {
      return NextResponse.json({ error: "This item isn't available." }, { status: 400 });
    }
    if (product.price_gbp == null || Number(product.price_gbp) <= 0) {
      return NextResponse.json({ error: "This item is priced on enquiry — please message the seller." }, { status: 400 });
    }
    if (product.stock != null && quantity > Number(product.stock)) {
      const n = Number(product.stock);
      return NextResponse.json(
        { error: n <= 0 ? "This item is out of stock." : `Only ${n} left in stock.` },
        { status: 400 },
      );
    }

    const { data: service } = await supabase
      .from("services")
      .select("id, title, slug, status, seller_id")
      .eq("id", product.service_id)
      .maybeSingle();
    if (!service || service.status !== "published" || !service.seller_id) {
      return NextResponse.json({ error: "This listing isn't available." }, { status: 400 });
    }
    if (service.seller_id === profile.id) {
      return NextResponse.json({ error: "You can't buy your own item." }, { status: 400 });
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

    // Featured (paying) members pay the lower commission.
    const { data: sub } = await supabase
      .from("sponsorships")
      .select("status")
      .eq("seller_id", service.seller_id)
      .eq("status", "active")
      .maybeSingle();
    const commissionRate = sub ? COMMISSION_FEATURED : COMMISSION_STANDARD;

    const unitGbp = Number(product.price_gbp);
    const amountGbp = Math.round(unitGbp * quantity * 100) / 100;
    const commissionGbp = Math.round(amountGbp * commissionRate * 100) / 100;
    const isPhysical = product.product_type !== "service";

    // Mint the order first so its id can tag the charge (transfer_group).
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        service_id: service.id,
        product_id: product.id,
        seller_id: service.seller_id,
        buyer_id: profile.id,
        buyer_email: profile.email ?? null,
        quantity,
        amount_gbp: amountGbp,
        commission_rate: commissionRate,
        commission_gbp: commissionGbp,
        currency: "gbp",
        status: "pending",
        fulfilment: product.fulfilment ?? null,
        revision_limit: product.revision_limit ?? null,
        transfer_group: null,
      })
      .select("id")
      .single();
    if (orderErr || !order) {
      console.error("[mkt-checkout] insert failed", orderErr);
      return NextResponse.json({ error: "Couldn't start the order." }, { status: 500 });
    }

    const transferGroup = `order_${order.id}`;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: profile.email ?? undefined,
      line_items: [
        {
          quantity,
          price_data: {
            currency: "gbp",
            unit_amount: Math.round(unitGbp * 100),
            product_data: { name: `${product.title} — ${service.title}` },
          },
        },
      ],
      // Collect a delivery address for physical goods so the seller can post it.
      ...(isPhysical
        ? { shipping_address_collection: { allowed_countries: ["GB"] as const } }
        : {}),
      payment_intent_data: {
        transfer_group: transferGroup,
        metadata: { order_id: order.id },
      },
      metadata: { order_id: order.id },
      success_url: `${siteUrl()}/dashboard/orders?order=success`,
      cancel_url: `${siteUrl()}/marketplace/${product.id}?order=cancel`,
    });

    await supabase
      .from("orders")
      .update({ stripe_checkout_session_id: session.id, transfer_group: transferGroup })
      .eq("id", order.id);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[mkt-checkout] failed", err);
    const message = err instanceof Error ? err.message : "Checkout failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
