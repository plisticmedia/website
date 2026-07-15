import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail, siteUrl } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Newsletter / story-notification signup with granular consent. Captures two
 * independent opt-ins (new-story alerts, and marketing) plus a consent
 * timestamp. Upserts by email so preferences can be updated and a re-signup
 * clears any prior unsubscribe.
 */
export async function POST(request: Request) {
  if (!rateLimit(`subscribe:${clientIp(request)}`, 8, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts just now — please try again shortly." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Please try again." }, { status: 400 });
  }
  const data = (body ?? {}) as Record<string, unknown>;

  const email = clean(data.email, 180).toLowerCase();
  const notifyStories = data.notify_stories === true;
  const marketing = data.marketing === true;
  const source = clean(data.source, 60) || "site";

  if (!emailPattern.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!notifyStories && !marketing) {
    return NextResponse.json({ error: "Please tick at least one option so we know what to send you." }, { status: 400 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Signups aren't set up yet. Please try again later." }, { status: 503 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("subscribers").upsert(
    {
      email,
      notify_stories: notifyStories,
      marketing,
      source,
      consent_at: new Date().toISOString(),
      unsubscribed_at: null,
    },
    { onConflict: "email" },
  );

  if (error) {
    console.error("[subscribe] failed", error);
    return NextResponse.json({ error: "We couldn't save that. Please try again." }, { status: 500 });
  }

  // Friendly confirmation (best-effort — never block the response).
  const wants = [notifyStories ? "new-story alerts" : null, marketing ? "our newsletter" : null].filter(Boolean).join(" and ");
  void sendEmail({
    to: email,
    subject: "You're on the Plistic list",
    text: `Thanks for signing up for ${wants}.\n\nWe'll only send what you asked for. To change your preferences or unsubscribe at any time, just reply to this email.\n\n${siteUrl()}`,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
