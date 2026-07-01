import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { importListingsFromCsv } from "@/lib/csvImport";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Scheduled auto-import of the Google Form responses sheet (see the cron entry
 * in vercel.json). Set GOOGLE_SHEET_CSV_URL to the sheet's "Publish to web → CSV"
 * link. New responses become *pending* listings for admin approval; existing
 * (unclaimed) ones are updated. Guarded by CRON_SECRET like the ratings cron.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const isVercelCron = request.headers.get("x-vercel-cron") !== null;
  if (secret) {
    if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } else if (!isVercelCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.GOOGLE_SHEET_CSV_URL;
  if (!url) return NextResponse.json({ ok: true, skipped: "GOOGLE_SHEET_CSV_URL not set" });

  let csv: string;
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return NextResponse.json({ error: `Sheet fetch failed: ${res.status}` }, { status: 502 });
    csv = await res.text();
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Sheet fetch failed" }, { status: 502 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const result = await importListingsFromCsv(supabase, csv, false); // pending, admin approves
  return NextResponse.json({ ok: true, ...result });
}
