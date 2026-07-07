import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { renderClaimInvite } from "@/lib/claimInvite";

export const runtime = "nodejs";
export const maxDuration = 60;

// Only ever target imported (source set), unclaimed (no owner) listings.
type Svc = ReturnType<typeof createSupabaseServiceRoleClient>;
function seedUnclaimed(supabase: Svc) {
  return supabase.from("services").select("*", { count: "exact", head: true }).is("seller_id", null).not("source", "is", null);
}

async function requireAdmin() {
  const profile = await getSessionProfile();
  return !!profile && profile.role === "admin";
}

/** Status + a preview of the exact email that would be sent. */
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const supabase = createSupabaseServiceRoleClient();

  const [{ count: eligible }, { count: alreadySent }, { count: noEmail }] = await Promise.all([
    seedUnclaimed(supabase).not("submitter_email", "is", null).is("claim_invite_sent_at", null),
    seedUnclaimed(supabase).not("claim_invite_sent_at", "is", null),
    seedUnclaimed(supabase).is("submitter_email", null),
  ]);

  // Render a real example from the next listing that would be emailed.
  const { data: sampleRow } = await supabase
    .from("services")
    .select("title, submitter_email, claim_token")
    .is("seller_id", null)
    .not("source", "is", null)
    .not("submitter_email", "is", null)
    .is("claim_invite_sent_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const sample = sampleRow
    ? { to: sampleRow.submitter_email as string, ...renderClaimInvite(sampleRow.title as string, sampleRow.claim_token as string) }
    : null;

  return NextResponse.json({
    ok: true,
    eligible: eligible ?? 0,
    alreadySent: alreadySent ?? 0,
    noEmail: noEmail ?? 0,
    sample,
  });
}

/** Send the next batch. Never sends unless called; marks each as sent so no one is emailed twice. */
export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email isn't configured (no RESEND_API_KEY)." }, { status: 503 });
  }
  const body = (await request.json().catch(() => ({}))) as { batchSize?: number };
  const batchSize = Math.min(50, Math.max(1, Math.floor(Number(body.batchSize) || 10)));

  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("services")
    .select("id, title, submitter_email, claim_token")
    .is("seller_id", null)
    .not("source", "is", null)
    .not("submitter_email", "is", null)
    .is("claim_invite_sent_at", null)
    .order("created_at", { ascending: true })
    .limit(batchSize);

  type Row = { id: string; title: string; submitter_email: string; claim_token: string };
  const rows = (data ?? []) as Row[];

  let sent = 0;
  let failed = 0;
  for (const r of rows) {
    const { subject, text } = renderClaimInvite(r.title, r.claim_token);
    const ok = await sendEmail({ to: r.submitter_email, subject, text });
    if (!ok) {
      failed += 1;
      continue; // leave unmarked so it can be retried
    }
    // Mark sent only after a successful send, so nobody is emailed twice.
    await supabase.from("services").update({ claim_invite_sent_at: new Date().toISOString() }).eq("id", r.id);
    sent += 1;
  }

  const { count: remaining } = await seedUnclaimed(supabase)
    .not("submitter_email", "is", null)
    .is("claim_invite_sent_at", null);

  return NextResponse.json({ ok: true, sent, failed, remaining: remaining ?? 0 });
}
