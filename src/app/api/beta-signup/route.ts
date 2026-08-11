import { NextResponse } from "next/server";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { registerBetaTester } from "@/lib/beta";

export const runtime = "nodejs";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (!rateLimit(`beta:${clientIp(request)}`, 6, 10 * 60 * 1000)) {
    return NextResponse.json(
      { ok: false, error: "Too many sign-ups just now — please try again shortly." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad("Please try again.");
  }
  const rec = (body ?? {}) as Record<string, unknown>;

  // Honeypot: bots fill hidden fields. Pretend success, do nothing.
  if (String(rec.company ?? "").trim()) return NextResponse.json({ ok: true });

  const email = String(rec.email ?? "").trim().toLowerCase().slice(0, 180);
  const name = String(rec.name ?? "").trim().slice(0, 120);
  const business = String(rec.business ?? "").trim().slice(0, 160);

  if (!emailPattern.test(email)) return bad("Please enter a valid email address.");

  try {
    await registerBetaTester({ name, email, businessName: business, source: "gate" });
  } catch (error) {
    console.error("[beta-signup] Failed to register beta tester.", error);
    return NextResponse.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

function bad(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}
