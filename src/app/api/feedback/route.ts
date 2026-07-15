import { NextResponse } from "next/server";
import { sendEmail, adminEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Beta feedback: a signed-in or anonymous tester sends a quick note from the
 * on-site feedback button. Emailed straight to the team inbox — no account or
 * database needed, so it's frictionless for testers.
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
  const page = clean(data.page, 300);
  if (!message) return NextResponse.json({ error: "Please add a note before sending." }, { status: 400 });

  const text = [
    "New beta feedback from Plistic:",
    "",
    message,
    "",
    email ? `From: ${email}` : "From: (not given)",
    page ? `Page: ${page}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  await sendEmail({ to: adminEmail(), subject: "Plistic beta feedback", text }).catch(() => {});

  return NextResponse.json({ ok: true });
}
