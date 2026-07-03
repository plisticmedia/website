import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSessionProfile } from "@/lib/auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/email";

export const runtime = "nodejs";

/** Starts a Stripe Checkout session for the per-account featured subscription. */
export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { plan?: string };
  const plan = body.plan === "monthly" ? "monthly" : "yearly";
  const priceId =
    plan === "monthly" ? process.env.STRIPE_FEATURED_PRICE_MONTHLY : process.env.STRIPE_FEATURED_PRICE_YEARLY;
  if (!priceId || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Payments aren't set up yet." }, { status: 503 });
  }

  const stripe = getStripe();
  const supabase = createSupabaseServiceRoleClient();

  // Ensure a Stripe customer exists for this seller account.
  const { data: prof } = await supabase
    .from("profiles")
    .select("stripe_customer_id, display_name")
    .eq("id", profile.id)
    .maybeSingle();

  let customerId = prof?.stripe_customer_id as string | null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.email ?? undefined,
      name: prof?.display_name ?? undefined,
      metadata: { seller_id: profile.id },
    });
    customerId = customer.id;
    await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", profile.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl()}/dashboard?featured=success`,
    cancel_url: `${siteUrl()}/dashboard?featured=cancel`,
    allow_promotion_codes: true,
    metadata: { seller_id: profile.id },
    subscription_data: { metadata: { seller_id: profile.id } },
  });

  return NextResponse.json({ url: session.url });
}
