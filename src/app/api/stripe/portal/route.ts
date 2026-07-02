import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSessionProfile } from "@/lib/auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/email";

export const runtime = "nodejs";

/** Opens the Stripe Billing Portal so a seller can manage/cancel their subscription. */
export async function POST() {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Payments aren't set up yet." }, { status: 503 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: prof } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", profile.id)
    .maybeSingle();

  const customerId = prof?.stripe_customer_id as string | null;
  if (!customerId) {
    return NextResponse.json({ error: "No subscription to manage yet." }, { status: 400 });
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${siteUrl()}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}
