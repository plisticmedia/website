import { siteUrl } from "@/lib/email";

/**
 * The claim-invitation email sent to an unclaimed seed listing's public email.
 *
 * ⚠️ PLACEHOLDER WORDING — replace the subject/body below with the exact copy
 * the owner provides. Keep the two placeholders: `${name}` (business name) and
 * `${link}` (their unique claim URL).
 */
export function renderClaimInvite(name: string, claimToken: string): { subject: string; text: string } {
  const link = `${siteUrl()}/claim/${claimToken}`;
  const subject = `${name} — your Plistic listing is ready to claim`;
  const text = [
    `Hi,`,
    ``,
    `We've added ${name} to Plistic — a new directory of Scotland's creative and media businesses — and built you a page as part of our launch.`,
    ``,
    `Preview it and claim it (about two minutes) here:`,
    link,
    ``,
    `Claiming is free and lets you edit your details, add photos and a showreel, and receive enquiries directly.`,
    ``,
    `If this isn't your business, or you'd prefer not to be listed, just reply and we'll remove it.`,
    ``,
    `Thanks,`,
    `The Plistic team`,
  ].join("\n");
  return { subject, text };
}
