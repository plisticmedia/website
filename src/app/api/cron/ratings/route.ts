import { NextResponse } from "next/server";
import { refreshRatings } from "@/lib/ratings";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Scheduled Google-ratings refresh (see the cron entry in vercel.json).
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
  return NextResponse.json({ ok: true, ...result });
}
