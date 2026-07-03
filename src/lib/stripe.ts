import Stripe from "stripe";

let cached: Stripe | null = null;

/**
 * Server-side Stripe client. Used for Billing (featured-listing
 * subscriptions), the Customer Portal, and one-off agency deposits.
 * The secret key must never be exposed to the browser.
 */
export function getStripe(): Stripe {
  if (cached) return cached;

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  // No apiVersion override — pin to the version bundled with the SDK.
  cached = new Stripe(secretKey, {
    appInfo: { name: "plistic-website" },
  });

  return cached;
}
