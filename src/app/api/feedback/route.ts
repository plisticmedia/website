import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Where beta feedback lands. Defaults to the team inbox; overridable in env. */
function feedbackEmail(): string {
  return process.env.FEEDBACK_NOTIFY_EMAIL?.trim() || "hello@plisticmedia.com";
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Beta feedback: a signed-in or anonymous tester sends a note from the feedback
 * page or the floating feedback button. Emailed straight to the team inbox AND
 * stored so it can be reviewed in the admin console — both best-effort, so a
 * hiccup in one never blocks the other or the tester.
 */
export async function POST(request: Request) {
  if (!rateLimit(`feedback:${clientIp(request)}`, 12, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Thanks! You've sent a few just now — give it a moment." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Please try again." }, { status: 400 });
  }
  const data = (body ?? {}) as Record<string, unknown>;

  const message = clean(data.message, 4000);
  const email = clean(data.email, 180);
  const name = clean(data.name, 120);
  const page = clean(data.page, 300);
  const ratingRaw = Number(data.rating);
  const rating = Number.isInteger(ratingRaw) && ratingRaw >= 1 && ratingRaw <= 5 ? ratingRaw : null;
  if (!message) return NextResponse.json({ error: "Please add a note before sending." }, { status: 400 });

  const text = [
    "New beta feedback from Plistic:",
    "",
    message,
    "",
    rating ? `Rating: ${rating}/5` : "",
    name ? `Name: ${name}` : "",
    email ? `From: ${email}` : "From: (not given)",
    page ? `Page: ${page}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  // Store for the admin console (best-effort — never blocks the response).
  try {
    await createSupabaseServiceRoleClient()
      .from("beta_feedback")
      .insert({ message, name: name || null, email: email || null, rating, page: page || null });
  } catch {
    /* storing must never break sending feedback */
  }

  await sendEmail({ to: feedbackEmail(), subject: "Plistic beta feedback", text }).catch(() => {});

  return NextResponse.json({ ok: true });
}
