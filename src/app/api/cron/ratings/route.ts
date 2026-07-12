import { NextResponse } from "next/server";
import { refreshRatings } from "@/lib/ratings";
import { sweepAutoReleases } from "@/lib/orders";
import { sendPricingFollowUps } from "@/lib/pricingLeads";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Daily maintenance cron (see vercel.json). Refreshes Google ratings and, since
 * Hobby caps us at 2 cron jobs, also sweeps marketplace escrow: any delivered
 * order past its 14-day buyer-confirmation window is auto-released to the seller.
 *
 * Protected by CRON_SECRET: Vercel Cron sends `Authorization: Bearer <secret>`
 * when the env var is set. If no secret is configured, only Vercel's own cron
 * header is trusted.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const isVercelCron = request.headers.get("x-vercel-cron") !== null;

  if (secret) {
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (!isVercelCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await refreshRatings(30);
  // Escrow auto-release is best-effort; never let a Stripe hiccup fail the cron.
  let releases = { released: 0, failed: 0 };
  try {
    releases = await sweepAutoReleases();
  } catch (err) {
    console.error("[cron] auto-release sweep failed", err);
  }
  // Follow up on unconverted calculator estimates (best-effort).
  const followUps = await sendPricingFollowUps(40);
  return NextResponse.json({ ok: true, ...result, releases, followUps });
}
