import { NextResponse } from "next/server";
import { brand } from "@/data/site";

export const runtime = "nodejs";

type DetailRow = {
  label: string;
  value: string;
};

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
    return jsonError("Please send the estimate again.", 400);
  }

  if (!isRecord(body)) {
    return jsonError("Please send the estimate again.", 400);
  }

  const serviceTitle = clean(body.serviceTitle, 120);
  const rangeText = clean(body.rangeText, 160);
  const name = clean(body.name, 120);
  const email = clean(body.email, 180).toLowerCase();
  const organisation = clean(body.organisation, 160);
  const projectNote = clean(body.projectNote, 1600);
  const rows = readRows(body.rows);
  const includes = readStringList(body.includes);
  const flags = readStringList(body.flags);
  const notes = readStringList(body.notes);
  const notIncluded = readStringList(body.notIncluded);

  if (!serviceTitle || !name || !email) {
    return jsonError("Please add your name and email before sending the estimate.", 400);
  }

  if (!emailPattern.test(email)) {
    return jsonError("Please enter a valid email address.", 400);
  }

  const notifyTo = getRecipients(process.env.PRICING_NOTIFY_EMAIL ?? process.env.EARN_NOTIFY_EMAIL ?? brand.email);
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PRICING_FROM_EMAIL ?? process.env.EARN_FROM_EMAIL ?? `Plistic <${brand.email}>`;

  if (notifyTo.length === 0) {
    return jsonError("The notification email is not configured.", 503);
  }

  const internalText = [
    "New Plistic pricing estimate submitted.",
    "",
    rowsToText([
      ["Name", name],
      ["Email", email],
      ["Organisation", organisation || "Not provided"],
      ["Service", serviceTitle],
      ["Estimated range", rangeText || "Scoped on call"],
      ["Project note", projectNote || "Not provided"],
    ]),
    "",
    "Calculator selections:",
    rows.length > 0 ? rowsToText(rows.map((row) => [row.label, row.value])) : "No selections received.",
    "",
    "In scope:",
    includes.length > 0 ? listToText(includes) : "None listed.",
    "",
    "Call notes:",
    flags.length > 0 ? listToText(flags) : "None listed.",
    "",
    "Estimator notes:",
    notes.length > 0 ? listToText(notes) : "None listed.",
    "",
    "Not included yet:",
    notIncluded.length > 0 ? listToText(notIncluded) : "None listed.",
  ].join("\n");

  const confirmationText = [
    `Hi ${firstName(name)},`,
    "",
    `Thanks for sending your ${serviceTitle.toLowerCase()} estimate to Plistic.`,
    "",
    `The current calculator range is: ${rangeText || "scoped on call"}. This is only an estimate, and full costings will be confirmed on a call once we understand the brief properly.`,
    "",
    "Our team now has your calculator selections and project note.",
    "",
    "Thanks again,",
    "Plistic",
  ].join("\n");

  if (!apiKey) {
    console.info("[pricing-lead] Email skipped because RESEND_API_KEY is not configured.", {
      serviceTitle,
      rangeText,
      name,
      email,
      organisation,
      projectNote,
      rows,
      includes,
      flags,
      notes,
      notIncluded,
    });

    if (process.env.NODE_ENV === "production") {
      return jsonError("Email is not configured yet. Please email hello@plisticmedia.com directly.", 503);
    }

    return NextResponse.json({ ok: true, emailConfigured: false });
  }

  try {
    await sendEmail(apiKey, from, {
      to: notifyTo,
      subject: `New pricing estimate: ${serviceTitle} - ${name}`,
      text: internalText,
    });
  } catch (error) {
    console.error("[pricing-lead] Internal email send failed.", error);
    return jsonError("We could not send the estimate. Please try again.", 502);
  }

  let confirmationSent = true;

  try {
    await sendEmail(apiKey, from, {
      to: [email],
      subject: "We have received your Plistic estimate",
      text: confirmationText,
    });
  } catch (error) {
    confirmationSent = false;
    console.warn("[pricing-lead] Visitor confirmation email failed, but the internal estimate was received.", error);
  }

  return NextResponse.json({ ok: true, emailConfigured: true, confirmationSent });
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
      reply_to: brand.email,
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

function readRows(value: unknown): DetailRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const label = clean(item.label, 80);
      const rowValue = clean(item.value, 180);

      return label && rowValue ? { label, value: rowValue } : null;
    })
    .filter((item): item is DetailRow => item !== null);
}

function readStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => clean(item, 240)).filter(Boolean);
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

function rowsToText(items: Array<[string, string]>) {
  return items.map(([label, value]) => `${label}: ${value}`).join("\n");
}

function listToText(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}
