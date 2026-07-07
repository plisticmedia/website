import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail, siteUrl } from "@/lib/email";
import { renderClaimInvite, renderClaimFollowUp } from "@/lib/claimInvite";

export const runtime = "nodejs";
export const maxDuration = 60;

type Svc = ReturnType<typeof createSupabaseServiceRoleClient>;
// Only ever target imported (source set), unclaimed (no owner) listings.
function seedUnclaimed(supabase: Svc) {
  return supabase.from("services").select("*", { count: "exact", head: true }).is("seller_id", null).not("source", "is", null);
}

async function requireAdmin() {
  const profile = await getSessionProfile();
  return !!profile && profile.role === "admin";
}

/** Status + previews of the exact emails that would be sent, and the no-email list. */
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const supabase = createSupabaseServiceRoleClient();

  const [{ count: initialEligible }, { count: alreadySent }, { count: noEmail }, { count: followupEligible }, { count: followupSent }] =
    await Promise.all([
      seedUnclaimed(supabase).not("submitter_email", "is", null).is("claim_invite_sent_at", null),
      seedUnclaimed(supabase).not("claim_invite_sent_at", "is", null),
      seedUnclaimed(supabase).is("submitter_email", null),
      // invited, still unclaimed, not yet followed up
      seedUnclaimed(supabase).not("submitter_email", "is", null).not("claim_invite_sent_at", "is", null).is("claim_followup_sent_at", null),
      seedUnclaimed(supabase).not("claim_followup_sent_at", "is", null),
    ]);

  // A real example for each email.
  const { data: nextInitial } = await supabase
    .from("services")
    .select("title, submitter_email, claim_token")
    .is("seller_id", null).not("source", "is", null)
    .not("submitter_email", "is", null).is("claim_invite_sent_at", null)
    .order("created_at", { ascending: true }).limit(1).maybeSingle();
  const { data: nextFollowup } = await supabase
    .from("services")
    .select("title, submitter_email, claim_token")
    .is("seller_id", null).not("source", "is", null)
    .not("submitter_email", "is", null).not("claim_invite_sent_at", "is", null).is("claim_followup_sent_at", null)
    .order("created_at", { ascending: true }).limit(1).maybeSingle();

  // The businesses with no email, so the owner can reach out by hand.
  const { data: noEmailRows } = await supabase
    .from("services")
    .select("title, website_url, claim_token, slug")
    .is("seller_id", null).not("source", "is", null).is("submitter_email", null)
    .order("title", { ascending: true }).limit(300);

  const sample = (row: { title: string; submitter_email: string | null; claim_token: string } | null, follow: boolean) =>
    row ? { to: row.submitter_email as string, ...(follow ? renderClaimFollowUp : renderClaimInvite)(row.title, row.claim_token) } : null;

  return NextResponse.json({
    ok: true,
    initialEligible: initialEligible ?? 0,
    alreadySent: alreadySent ?? 0,
    noEmail: noEmail ?? 0,
    followupEligible: followupEligible ?? 0,
    followupSent: followupSent ?? 0,
    sampleInitial: sample(nextInitial as never, false),
    sampleFollowup: sample(nextFollowup as never, true),
    noEmailList: ((noEmailRows ?? []) as Array<{ title: string; website_url: string | null; claim_token: string }>).map((r) => ({
      title: r.title,
      website: r.website_url,
      claimLink: `${siteUrl()}/claim/${r.claim_token}`,
    })),
  });
}

/** Send the next batch. Never sends unless called; marks each so no one is emailed twice. */
export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email isn't configured (no RESEND_API_KEY)." }, { status: 503 });
  }
  const body = (await request.json().catch(() => ({}))) as { batchSize?: number; mode?: string };
  const followup = body.mode === "followup";
  const batchSize = Math.min(50, Math.max(1, Math.floor(Number(body.batchSize) || 20)));

  const supabase = createSupabaseServiceRoleClient();
  const sentColumn = followup ? "claim_followup_sent_at" : "claim_invite_sent_at";

  let q = supabase
    .from("services")
    .select("id, title, submitter_email, claim_token")
    .is("seller_id", null).not("source", "is", null)
    .not("submitter_email", "is", null)
    .is(sentColumn, null);
  // The follow-up only goes to those who already got the first email.
  if (followup) q = q.not("claim_invite_sent_at", "is", null);
  const { data } = await q.order("created_at", { ascending: true }).limit(batchSize);

  type Row = { id: string; title: string; submitter_email: string; claim_token: string };
  const rows = (data ?? []) as Row[];

  let sent = 0;
  let failed = 0;
  for (const r of rows) {
    const { subject, text } = (followup ? renderClaimFollowUp : renderClaimInvite)(r.title, r.claim_token);
    const ok = await sendEmail({ to: r.submitter_email, subject, text });
    if (!ok) {
      failed += 1;
      continue; // leave unmarked so it can be retried
    }
    await supabase.from("services").update({ [sentColumn]: new Date().toISOString() }).eq("id", r.id);
    sent += 1;
  }

  let remainingQ = seedUnclaimed(supabase).not("submitter_email", "is", null).is(sentColumn, null);
  if (followup) remainingQ = remainingQ.not("claim_invite_sent_at", "is", null);
  const { count: remaining } = await remainingQ;

  return NextResponse.json({ ok: true, sent, failed, remaining: remaining ?? 0 });
}
