import { brand } from "@/data/site";

/**
 * Sends a plain-text email via Resend. No-ops (returns false) when
 * RESEND_API_KEY isn't set, and never throws — sending mail must not break the
 * action that triggered it. Reuses the verified EARN_FROM_EMAIL sender.
 */
export async function sendEmail(opts: { to: string | string[]; subject: string; text: string }): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EARN_FROM_EMAIL ?? `Plistic <${brand.email}>`;
  if (!apiKey) {
    console.info("[email] skipped (no RESEND_API_KEY)", { subject: opts.subject });
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: Array.isArray(opts.to) ? opts.to : [opts.to],
        subject: opts.subject,
        text: opts.text,
        reply_to: brand.email,
      }),
    });
    if (!res.ok) {
      console.error("[email] send failed", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] error", error);
    return false;
  }
}

/** Internal notification recipient. */
export function adminEmail(): string {
  return process.env.EARN_NOTIFY_EMAIL ?? brand.email;
}

/** Public site origin (no trailing slash) for links in emails. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.plisticmedia.com").replace(/\/$/, "");
}
