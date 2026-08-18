import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail, siteUrl } from "@/lib/email";

/** The beta / coming-soon access password shared with beta testers. */
export const BETA_PASSWORD = "plisticbeta";

/**
 * Record a beta-tester sign-up and send them the welcome email (with the access
 * password and how to give feedback). Best-effort: storage and email failures
 * are logged, never thrown to the caller's happy path unless storage itself
 * errors in a way the caller wants to surface.
 */
export async function registerBetaTester(opts: {
  name?: string;
  email: string;
  businessName?: string;
  source: "gate" | "list-your-business";
}): Promise<void> {
  const email = opts.email.trim().toLowerCase();
  if (!email) return;

  const supabase = createSupabaseServiceRoleClient();
  await supabase.from("beta_signups").insert({
    name: opts.name?.trim() || null,
    email,
    business_name: opts.businessName?.trim() || null,
    source: opts.source,
  });

  // If they already have an account, grant it directory access now. (New
  // accounts are handled by the handle_new_user trigger via email match.)
  await supabase.rpc("grant_beta_access_by_email", { p_email: email });

  await sendBetaWelcome(email, opts.name);
}

async function sendBetaWelcome(email: string, name?: string) {
  const firstName = (name ?? "").trim().split(/\s+/)[0] || "there";
  const text = [
    `Hi ${firstName},`,
    "",
    "Thanks for signing up as a Plistic beta tester — we're really glad to have you on board.",
    "",
    "As a beta tester you get early access to the Plistic Media Directory before it opens to the public. You can claim your business, customise your page — logo, photos, showreel, packages and prices — and be one of the first businesses listed.",
    "",
    "There's also a brand-new marketplace to try: businesses can sell items and services, take bookings, send custom offers, and offer staged 'milestone' payments (a deposit up front, released to the seller as each stage is approved). Buyers can pay, all the way through to delivery.",
    "",
    `Your access password: ${BETA_PASSWORD}`,
    "When you open the Media Directory you'll be asked for this password — enter it there and you're in. You'll stay signed in after that, so you won't need to type it again.",
    "",
    `Get started: ${siteUrl()}/directory`,
    "",
    "TESTING PAYMENTS",
    "The marketplace and bookings are in test mode, so NO real money is taken and no card is ever charged. When you try buying an item, booking a package, or paying an offer, you'll be taken to a Stripe payment screen — pay with this test card:",
    "",
    "  Card number:  4242 4242 4242 4242",
    "  Expiry:       any future date (e.g. 12/34)",
    "  CVC:          any 3 digits",
    "  Name/address: anything you like",
    "",
    "A real card will simply be declined in test mode, so you can test the whole buy → deliver → confirm flow safely.",
    "",
    "Spotted a bug or have feedback? We'd genuinely love to hear it — just reply to this email, or use the feedback button in the bottom corner of the site. Every note helps us make it better before launch.",
    "",
    "Thanks again,",
    "The Plistic team",
  ].join("\n");

  try {
    await sendEmail({ to: email, subject: "Welcome to the Plistic beta", text });
  } catch (error) {
    console.warn("[beta] Welcome email failed to send.", error);
  }
}
