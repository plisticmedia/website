import { NextResponse } from "next/server";
import { getAdminApiContext } from "@/lib/auth";
import { runBackup } from "@/lib/backup";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Run a data backup on demand (admin-only). The same snapshot the weekly cron
 * takes — dumps every table to a private Storage bucket and emails a summary.
 * Lets an admin verify backups work and grab a fresh one before risky changes.
 */
export async function POST() {
  const ctx = await getAdminApiContext();
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const result = await runBackup();
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Backup failed." }, { status: 500 });
  }
  return NextResponse.json(result);
}
