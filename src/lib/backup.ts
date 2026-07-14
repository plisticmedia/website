import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail, adminEmail } from "@/lib/email";

/**
 * Lightweight scheduled backup for the Supabase free tier (which has no
 * automatic backups). Dumps every application table to a single JSON snapshot
 * and stores it in a PRIVATE Storage bucket, then emails a short confirmation
 * (row counts only — no personal data leaves the database). Keeps the most
 * recent snapshots and prunes the rest.
 *
 * Called weekly from the daily maintenance cron (Hobby caps us at 2 cron jobs,
 * so we piggy-back rather than add a third). Best-effort: it must never throw
 * into the cron.
 */

const BUCKET = "plistic-backups";
const KEEP = 12; // ~3 months of weekly snapshots

// Every application table (from supabase/migrations). A missing table is
// skipped, not fatal, so this list can drift ahead of the schema safely.
const TABLES = [
  "profiles",
  "categories",
  "locations",
  "services",
  "listing_services",
  "service_areas",
  "service_packages",
  "service_media",
  "service_views",
  "enquiries",
  "claims",
  "sponsorships",
  "showcase_items",
  "orders",
  "order_events",
  "payouts",
  "reviews",
  "disputes",
  "leads",
  "referrals",
  "partnerships",
  "quotes",
  "bookings",
  "payments",
  "pricing_leads",
] as const;

export type BackupResult = {
  ok: boolean;
  filename?: string;
  totalRows?: number;
  bytes?: number;
  skipped?: string[];
  error?: string;
};

/** Run a full snapshot: dump → store → prune → email. Never throws. */
export async function runBackup(): Promise<BackupResult> {
  try {
    const supabase = createSupabaseServiceRoleClient();

    const dump: Record<string, unknown[]> = {};
    const counts: Record<string, number> = {};
    const skipped: string[] = [];
    let totalRows = 0;

    for (const table of TABLES) {
      const { data, error } = await supabase.from(table).select("*");
      if (error || !data) {
        skipped.push(table);
        continue;
      }
      dump[table] = data;
      counts[table] = data.length;
      totalRows += data.length;
    }

    const stamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const filename = `backup-${stamp}.json`;
    const payload = JSON.stringify(
      { generatedAt: new Date().toISOString(), counts, data: dump },
      null,
      2,
    );
    const bytes = Buffer.byteLength(payload, "utf8");

    // Ensure the private bucket exists (ignore "already exists").
    await supabase.storage.createBucket(BUCKET, { public: false }).catch(() => {});

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filename, Buffer.from(payload, "utf8"), {
        contentType: "application/json",
        upsert: true,
      });
    if (uploadError) throw new Error(`upload failed: ${uploadError.message}`);

    await prune(supabase);

    await sendEmail({
      to: adminEmail(),
      subject: `Plistic backup saved — ${stamp} (${totalRows} records)`,
      text: backupSummary({ stamp, filename, totalRows, bytes, counts, skipped }),
    });

    return { ok: true, filename, totalRows, bytes, skipped };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[backup] failed", message);
    // Alert so a silent failure never gives a false sense of safety.
    await sendEmail({
      to: adminEmail(),
      subject: "⚠️ Plistic backup FAILED",
      text: `The scheduled Supabase backup did not complete.\n\nError: ${message}\n\nThe site is unaffected, but no new snapshot was saved. If this repeats, it's worth moving Supabase to the paid plan (which includes automatic daily backups).`,
    }).catch(() => {});
    return { ok: false, error: message };
  }
}

/** Keep the newest KEEP snapshots; delete the rest. */
async function prune(supabase: ReturnType<typeof createSupabaseServiceRoleClient>) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list("", { limit: 100, sortBy: { column: "name", order: "desc" } });
  if (error || !data) return;
  const stale = data.slice(KEEP).map((f: { name: string }) => f.name);
  if (stale.length) {
    await supabase.storage.from(BUCKET).remove(stale).catch(() => {});
  }
}

function backupSummary(args: {
  stamp: string;
  filename: string;
  totalRows: number;
  bytes: number;
  counts: Record<string, number>;
  skipped: string[];
}): string {
  const kb = Math.max(1, Math.round(args.bytes / 1024));
  const lines = Object.entries(args.counts)
    .filter(([, n]) => n > 0)
    .map(([t, n]) => `  ${t}: ${n}`)
    .join("\n");
  return [
    `Your weekly Plistic backup ran successfully.`,
    ``,
    `Date: ${args.stamp}`,
    `File: ${args.filename} (${kb} KB, ${args.totalRows} records)`,
    `Stored in: Supabase → Storage → "${BUCKET}" (private).`,
    ``,
    `Records by table:`,
    lines || "  (none yet)",
    args.skipped.length ? `\nSkipped (not present): ${args.skipped.join(", ")}` : ``,
    ``,
    `This snapshot lets your data be restored if anything is ever deleted or`,
    `corrupted. No personal data is included in this email — only the counts above.`,
  ].join("\n");
}
