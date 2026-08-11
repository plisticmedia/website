import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

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
    `Your access password: ${BETA_PASSWORD}`,
    "Enter it on the directory's \"coming soon\" screen to get in.",
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
