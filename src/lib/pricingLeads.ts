import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail, siteUrl } from "@/lib/email";

type LeadInput = {
  name: string;
  email: string;
  organisation?: string;
  serviceTitle: string;
  rangeText?: string;
  projectNote?: string;
};

/** Persist a calculator estimate so we can follow it up. Best-effort. */
export async function storePricingLead(lead: LeadInput): Promise<void> {
  try {
    const supabase = createSupabaseServiceRoleClient();
    await supabase.from("pricing_leads").insert({
      name: lead.name || null,
      email: lead.email,
      organisation: lead.organisation || null,
      service_title: lead.serviceTitle || null,
      range_text: lead.rangeText || null,
      project_note: lead.projectNote || null,
    });
  } catch (err) {
    // Storing a lead must never break the estimate flow.
    console.error("[pricing-leads] store failed", err);
  }
}

function firstName(name: string | null): string {
  return (name ?? "").split(/\s+/)[0] || "there";
}

/**
 * Sends a single gentle follow-up to estimate leads that are a few days old and
 * haven't already been followed up — unless that email has since sent an enquiry
 * (a reasonable "already in touch" signal). Run from the daily cron. Returns a
 * small summary. Never throws — best-effort.
 */
export async function sendPricingFollowUps(limit = 40): Promise<{ sent: number; skipped: number }> {
  let sent = 0;
  let skipped = 0;
  try {
    const supabase = createSupabaseServiceRoleClient();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("pricing_leads")
      .select("id, name, email, service_title, range_text")
      .is("followup_sent_at", null)
      .lte("created_at", threeDaysAgo)
      .order("created_at", { ascending: true })
      .limit(limit);

    const leads = (data ?? []) as Array<{
      id: string; name: string | null; email: string; service_title: string | null; range_text: string | null;
    }>;

    for (const lead of leads) {
      // Don't nudge someone who has since been in touch via an enquiry.
      const { count } = await supabase
        .from("enquiries")
        .select("id", { count: "exact", head: true })
        .eq("buyer_email", lead.email);
      const inTouch = (count ?? 0) > 0;

      if (!inTouch) {
        const service = (lead.service_title ?? "your project").toLowerCase();
        const text = [
          `Hi ${firstName(lead.name)},`,
          ``,
          `A few days ago you put together a ${service} estimate on our site${lead.range_text ? ` (around ${lead.range_text})` : ""} — I wanted to check you got everything you needed.`,
          ``,
          `If it would help to talk it through, the quickest next step is a short, no-obligation call. You can grab a time here:`,
          ``,
          `${siteUrl()}/book`,
          ``,
          `And if the timing's not right, no problem at all — just reply and let me know.`,
          ``,
          `Best,`,
          `Kayla — Plistic`,
        ].join("\n");

        try {
          await sendEmail({
            to: lead.email,
            subject: `Following up on your Plistic estimate`,
            text,
          });
          sent += 1;
        } catch (err) {
          console.error("[pricing-leads] follow-up send failed", err);
          continue; // leave followup_sent_at null so we retry next run
        }
      } else {
        skipped += 1;
      }

      // Mark as handled either way (sent, or skipped because already in touch).
      await supabase
        .from("pricing_leads")
        .update({ followup_sent_at: new Date().toISOString() })
        .eq("id", lead.id);
    }
  } catch (err) {
    console.error("[pricing-leads] follow-up sweep failed", err);
  }
  return { sent, skipped };
}
