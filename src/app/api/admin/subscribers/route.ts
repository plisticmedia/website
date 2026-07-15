import { NextResponse } from "next/server";
import { getAdminApiContext } from "@/lib/auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Export the mailing list as CSV (admin-only) so it can be viewed in a
 * spreadsheet or imported into an email tool (Resend, Mailchimp, …).
 * Only active (not unsubscribed) subscribers.
 */
export async function GET() {
  const ctx = await getAdminApiContext();
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("subscribers")
    .select("email, notify_stories, marketing, source, consent_at, created_at")
    .is("unsubscribed_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as Array<{
    email: string;
    notify_stories: boolean;
    marketing: boolean;
    source: string | null;
    consent_at: string;
    created_at: string;
  }>;

  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = ["email", "story_alerts", "newsletter", "source", "consent_at", "signed_up"].join(",");
  const body = rows
    .map((r) => [esc(r.email), r.notify_stories, r.marketing, esc(r.source), esc(r.consent_at), esc(r.created_at)].join(","))
    .join("\n");

  return new NextResponse(`${header}\n${body}\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="plistic-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
