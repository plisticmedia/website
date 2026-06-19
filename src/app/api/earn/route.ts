import { NextResponse } from "next/server";
import { brand } from "@/data/site";

export const runtime = "nodejs";

type EarnType = "referral" | "partner";

type EmailPayload = {
  to: string[];
  subject: string;
  text: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Please send the form again.", 400);
  }

  if (!isRecord(body)) {
    return jsonError("Please send the form again.", 400);
  }

  const type = clean(body.type, 40) as EarnType;

  if (type !== "referral" && type !== "partner") {
    return jsonError("Please choose a valid form.", 400);
  }

  const result = type === "referral" ? buildReferralEmails(body) : buildPartnerEmails(body);

  if (!result.ok) {
    return jsonError(result.error, 400);
  }

  const notifyTo = getRecipients(process.env.EARN_NOTIFY_EMAIL ?? brand.email);
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EARN_FROM_EMAIL ?? `Plistic <${brand.email}>`;

  if (notifyTo.length === 0) {
    return jsonError("The notification email is not configured.", 503);
  }

  if (!apiKey) {
    console.info("[earn-form] Email skipped because RESEND_API_KEY is not configured.", {
      type,
      payload: result.logSafePayload,
    });

    if (process.env.NODE_ENV === "production") {
      return jsonError("Email is not configured yet. Please email hello@plistic.media directly.", 503);
    }

    return NextResponse.json({ ok: true, emailConfigured: false });
  }

  try {
    await Promise.all([
      sendEmail(apiKey, from, {
        to: notifyTo,
        subject: result.internalSubject,
        text: result.internalText,
      }),
      sendEmail(apiKey, from, result.confirmationEmail),
    ]);
  } catch (error) {
    console.error("[earn-form] Email send failed.", error);
    return jsonError("We could not send the confirmation email. Please try again.", 502);
  }

  return NextResponse.json({ ok: true, emailConfigured: true });
}

function buildReferralEmails(body: Record<string, unknown>) {
  const referrerName = clean(body.referrerName, 120);
  const referrerEmail = clean(body.referrerEmail, 180).toLowerCase();
  const referredName = clean(body.referredName, 120);
  const referredEmail = clean(body.referredEmail, 180).toLowerCase();
  const projectDescription = clean(body.projectDescription, 1800);

  if (!referrerName || !referrerEmail || !referredName || !referredEmail) {
    return { ok: false as const, error: "Please complete the required referral fields." };
  }

  if (!emailPattern.test(referrerEmail) || !emailPattern.test(referredEmail)) {
    return { ok: false as const, error: "Please enter valid email addresses." };
  }

  const internalText = [
    "New Plistic referral submitted.",
    "",
    rows([
      ["Referrer", referrerName],
      ["Referrer email", referrerEmail],
      ["Referred contact", referredName],
      ["Referred email", referredEmail],
      ["Project description", projectDescription || "Not provided"],
    ]),
    "",
    "Workflow: confirmation has been sent to the referrer. Jessie should follow up with the referred contact within 24 hours.",
    "Referral terms: 10% of the confirmed paid project value, paid once the client's invoice is settled.",
  ].join("\n");

  const confirmationText = [
    `Hi ${firstName(referrerName)},`,
    "",
    `Thanks for sending ${referredName} our way. We have received the referral and the Plistic team has been notified.`,
    "",
    "Jessie will follow up with the referred contact within 24 hours. If the project becomes a confirmed, paid Plistic project, your referral fee is 10% of the total project value, paid once the client's invoice is settled.",
    "",
    "Thanks again,",
    "Plistic",
  ].join("\n");

  return {
    ok: true as const,
    internalSubject: `New referral: ${referredName}`,
    internalText,
    confirmationEmail: {
      to: [referrerEmail],
      subject: "We have received your Plistic referral",
      text: confirmationText,
    },
    logSafePayload: { referrerName, referrerEmail, referredName, referredEmail, projectDescription },
  };
}

function buildPartnerEmails(body: Record<string, unknown>) {
  const partnerName = clean(body.partnerName, 120);
  const partnerEmail = clean(body.partnerEmail, 180).toLowerCase();
  const partnerCompany = clean(body.partnerCompany, 160);
  const partnerDiscipline = clean(body.partnerDiscipline, 160);
  const partnerMessage = clean(body.partnerMessage, 1800);

  if (!partnerName || !partnerEmail || !partnerDiscipline || !partnerMessage) {
    return { ok: false as const, error: "Please complete the required partnership fields." };
  }

  if (!emailPattern.test(partnerEmail)) {
    return { ok: false as const, error: "Please enter a valid email address." };
  }

  const internalText = [
    "New Plistic partnership enquiry.",
    "",
    rows([
      ["Name", partnerName],
      ["Email", partnerEmail],
      ["Company", partnerCompany || "Not provided"],
      ["Discipline", partnerDiscipline],
      ["Message", partnerMessage],
    ]),
    "",
    "Context: this is for the trusted Scottish creative partner network. No public directory is live yet.",
  ].join("\n");

  const confirmationText = [
    `Hi ${firstName(partnerName)},`,
    "",
    "Thanks for getting in touch about partnering with Plistic. We have received your message and will review where your work could fit within the trusted partner network we are building.",
    "",
    "We are launching carefully with a small group of confirmed partners across different creative functions before the full directory goes live.",
    "",
    "Thanks again,",
    "Plistic",
  ].join("\n");

  return {
    ok: true as const,
    internalSubject: `New partner enquiry: ${partnerName}`,
    internalText,
    confirmationEmail: {
      to: [partnerEmail],
      subject: "We have received your Plistic partnership enquiry",
      text: confirmationText,
    },
    logSafePayload: { partnerName, partnerEmail, partnerCompany, partnerDiscipline, partnerMessage },
  };
}

async function sendEmail(apiKey: string, from: string, payload: EmailPayload) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "plistic-website/1.0",
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend returned ${response.status}: ${details}`);
  }
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function firstName(name: string) {
  return name.split(/\s+/)[0] || "there";
}

function getRecipients(value: string) {
  return value
    .split(",")
    .map((recipient) => recipient.trim())
    .filter(Boolean);
}

function rows(items: Array<[string, string]>) {
  return items.map(([label, value]) => `${label}: ${value}`).join("\n");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}
