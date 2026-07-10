import { NextResponse } from "next/server";
import { getAdminApiContext } from "@/lib/auth";
import { googlePlacesConfigured } from "@/lib/googlePlaces";
import { refreshRatings } from "@/lib/ratings";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Refresh Google ratings for a batch of listings. Admin-only. */
export async function POST() {
  const ctx = await getAdminApiContext();
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  if (!googlePlacesConfigured()) {
    return NextResponse.json(
      { error: "Google ratings aren't set up yet — add the GOOGLE_PLACES_API_KEY environment variable in Vercel." },
      { status: 503 },
    );
  }

  const result = await refreshRatings(20);
  return NextResponse.json({ ok: true, ...result });
}
