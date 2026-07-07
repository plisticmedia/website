import { siteUrl } from "@/lib/email";

// Public launch date referenced in the invites. ⚠️ Change this if the date moves.
export const LAUNCH_DATE = "13 July 2026";

/** The first claim-invitation email (Kayla's wording). */
export function renderClaimInvite(name: string, claimToken: string): { subject: string; text: string } {
  const link = `${siteUrl()}/claim/${claimToken}`;
  const subject = `${name}, your page is ready — help us put Scotland's creative talent on the map`;
  const text = [
    `Hi ${name} team,`,
    ``,
    `Something we're genuinely excited about: we're building Plistic — a new home and showcase for Scotland's whole creative and media scene, made to get our talent seen, found and hired, here and around the world. For a country our size we punch well above our weight, and it's about time we had one place that showed it.`,
    ``,
    `We'd love ${name} to be part of it from the very start — so we've already built your page. You just need to claim it:`,
    ``,
    `Claim your page → ${link}`,
    ``,
    `It takes about two minutes and it's free. Add your work and showreel, edit your details, and get found and hired by the people looking for exactly what you do. Everyone claimed before we launch on ${LAUNCH_DATE} is featured from day one.`,
    ``,
    `If this isn't your business, or you'd rather not be listed, just reply and we'll take it down.`,
    ``,
    `Thanks so much — excited to have you with us,`,
    `Kayla — Founder, Plistic`,
  ].join("\n");
  return { subject, text };
}

/** The one-week follow-up nudge, for listings invited but not yet claimed. */
export function renderClaimFollowUp(name: string, claimToken: string): { subject: string; text: string } {
  const link = `${siteUrl()}/claim/${claimToken}`;
  const subject = `${name}, a quick reminder — claim your Plistic page before we launch`;
  const text = [
    `Hi ${name} team,`,
    ``,
    `Just a quick nudge — we've saved a page for ${name} on Plistic, the new showcase for Scotland's creative and media scene, and it's still waiting to be claimed.`,
    ``,
    `Claim your page → ${link}`,
    ``,
    `It takes about two minutes and it's free, and everyone claimed before we launch on ${LAUNCH_DATE} is featured from day one — we'd love to have you in from the start.`,
    ``,
    `If it's not for you, no problem at all — just reply and we'll take the page down.`,
    ``,
    `Thanks,`,
    `Kayla — Founder, Plistic`,
  ].join("\n");
  return { subject, text };
}
