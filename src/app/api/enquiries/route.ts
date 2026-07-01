import { NextResponse } from "next/server";
import { brand } from "@/data/site";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Please send the form again.", 400);
  }
  if (typeof body !== "object" || body === null) {
    return jsonError("Please send the form again.", 400);
  }
  const data = body as Record<string, unknown>;

  // Honeypot: silently accept (don't tip off bots) but do nothing.
  if (clean(data.company, 100)) {
    return NextResponse.json({ ok: true });
  }

  const serviceId = clean(data.serviceId, 80);
  const name = clean(data.name, 120);
  const email = clean(data.email, 180).toLowerCase();
  const message = clean(data.message, 2000);

  if (!serviceId || !name || !email || !message) {
    return jsonError("Please complete all fields.", 400);
  }
  if (!emailPattern.test(email)) {
    return jsonError("Please enter a valid email address.", 400);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return jsonError("Enquiries are not configured yet. Please try again later.", 503);
  }

  const supabase = createSupabaseServiceRoleClient();

  // Look up the listing (must be published) and its seller.
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, title, seller_id, status")
    .eq("id", serviceId)
    .eq("status", "published")
    .maybeSingle();

  if (serviceError || !service) {
    return jsonError("That listing is no longer available.", 404);
  }

  const { error: insertError } = await supabase.from("enquiries").insert({
    service_id: service.id,
    seller_id: service.seller_id,
    buyer_name: name,
    buyer_email: email,
    message,
  });

  if (insertError) {
    console.error("[enquiry] insert failed", insertError);
    return jsonError("We could not record your enquiry. Please try again.", 500);
  }

  // Best-effort notifications — never block the success response.
  void sendEnquiryEmails(supabase, service, { name, email, message }).catch((e) =>
    console.error("[enquiry] email failed", e),
  );

  return NextResponse.json({ ok: true });
}

type ServiceRow = { id: string; title: string; seller_id: string };

async function sendEnquiryEmails(
  supabase: ReturnType<typeof createSupabaseServiceRoleClient>,
  service: ServiceRow,
  buyer: { name: string; email: string; message: string },
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = clean(process.env.EARN_FROM_EMAIL, 240) || `Plistic <${brand.email}>`;
  if (!apiKey) return;

  // Seller's email lives on the auth user.
  const { data: userData } = await supabase.auth.admin.getUserById(service.seller_id);
  const sellerEmail = userData?.user?.email;

  const teamInbox = (process.env.EARN_NOTIFY_EMAIL ?? brand.email)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const sellerText = [
    `You have a new enquiry about "${service.title}" via the Plistic directory.`,
    "",
    `From: ${buyer.name} <${buyer.email}>`,
    "",
    "Message:",
    buyer.message,
    "",
    `Reply directly to ${buyer.email}. Plistic introduces buyers and sellers but is not a party to the agreement.`,
  ].join("\n");

  const buyerText = [
    `Hi ${buyer.name.split(/\s+/)[0] || "there"},`,
    "",
    `Thanks for your enquiry about "${service.title}". We've passed it to the seller, who will reply to you directly at ${buyer.email}.`,
    "",
    "Plistic",
  ].join("\n");

  const messages: Array<{ to: string[]; subject: string; text: string }> = [];
  if (sellerEmail) {
    messages.push({ to: [sellerEmail], subject: `New enquiry: ${service.title}`, text: sellerText });
  }
  if (teamInbox.length) {
    messages.push({ to: teamInbox, subject: `[Directory] enquiry: ${service.title}`, text: sellerText });
  }
  messages.push({ to: [buyer.email], subject: "We've passed on your Plistic enquiry", text: buyerText });

  await Promise.all(
    messages.map((m) =>
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, ...m }),
      }),
    ),
  );
}
