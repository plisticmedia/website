import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Cal.com booking webhook -> `bookings` table.
 * Configure in Cal.com with a signing secret set as CALCOM_WEBHOOK_SECRET.
 * Idempotent on the booking uid.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const secret = process.env.CALCOM_WEBHOOK_SECRET;

  // Verify the HMAC signature when a secret is configured.
  if (secret) {
    const sig = request.headers.get("x-cal-signature-256") ?? "";
    const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
    }
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: true, stored: false });
  }

  let event: { triggerEvent?: string; payload?: Record<string, unknown> };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload." }, { status: 400 });
  }

  const p = (event.payload ?? {}) as Record<string, unknown>;
  const attendees = Array.isArray(p.attendees) ? (p.attendees as Array<Record<string, unknown>>) : [];
  const attendee = attendees[0] ?? {};
  const uid = typeof p.uid === "string" ? p.uid : null;
  const scheduledAt = typeof p.startTime === "string" ? p.startTime : null;
  const status =
    event.triggerEvent === "BOOKING_CANCELLED"
      ? "canceled"
      : event.triggerEvent === "BOOKING_RESCHEDULED"
        ? "scheduled"
        : "scheduled";

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("bookings").upsert(
    {
      name: (attendee.name as string) ?? null,
      email: (attendee.email as string) ?? null,
      external_event_id: uid,
      scheduled_at: scheduledAt,
      status,
      payload: event as unknown as Record<string, unknown>,
    },
    { onConflict: "external_event_id" },
  );

  if (error) {
    console.error("[calcom-webhook] insert failed", error);
    return NextResponse.json({ error: "Could not store booking." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, stored: true });
}
