import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSessionProfile } from "@/lib/auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

/**
 * Starts (or resumes) Stripe Connect Express onboarding for a seller, so they
 * can receive marketplace payouts. Creates an Express account on first use and
 * returns a Stripe-hosted onboarding link. No money moves here — the seller's
 * `payouts_enabled` flag is synced later by the `account.updated` webhook.
 */
export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (!rateLimit(`connect:${clientIp(request)}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Payments aren't set up yet." }, { status: 503 });
  }

  try {
    const stripe = getStripe();
    const supabase = createSupabaseServiceRoleClient();

    const { data: prof } = await supabase
      .from("profiles")
      .select("stripe_connect_account_id")
      .eq("id", profile.id)
      .maybeSingle();

    let accountId = prof?.stripe_connect_account_id as string | null;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: profile.email ?? undefined,
        capabilities: { transfers: { requested: true } },
        metadata: { seller_id: profile.id },
      });
      accountId = account.id;
      await supabase
        .from("profiles")
        .update({ stripe_connect_account_id: accountId })
        .eq("id", profile.id);
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${siteUrl()}/dashboard/payouts?connect=refresh`,
      return_url: `${siteUrl()}/dashboard/payouts?connect=done`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: link.url });
  } catch (err) {
    console.error("[stripe-connect] onboard failed", err);
    const message = err instanceof Error ? err.message : "Onboarding failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
