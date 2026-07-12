import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { sendEmail, adminEmail, siteUrl } from "@/lib/email";
import { toShowcaseEmbed } from "@/lib/showcase";

export const runtime = "nodejs";

const KINDS = ["video", "image", "event", "news", "work"];

function clean(v: FormDataEntryValue | null, max = 300) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}
function normalizeUrl(v: string): string {
  if (!v) return "";
  return /^https?:\/\//i.test(v) ? v : `https://${v.replace(/^\/+/, "")}`;
}

/** Public submission to the Best-of-Scotland showcase. Arrives as 'pending'. */
export async function POST(request: Request) {
  if (!rateLimit(`showcase:${clientIp(request)}`, 5, 30 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many submissions just now — please try again shortly." }, { status: 429 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Submissions aren't configured yet." }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Please submit the form again." }, { status: 400 });
  }

  // Honeypot.
  if (clean(form.get("company"), 100)) return NextResponse.json({ ok: true });

  const kindRaw = clean(form.get("kind"), 20);
  const kind = KINDS.includes(kindRaw) ? kindRaw : "work";
  const title = clean(form.get("title"), 160);
  const summary = clean(form.get("summary"), 600);
  const link = normalizeUrl(clean(form.get("link_url"), 400));
  const embed = normalizeUrl(clean(form.get("embed_url"), 400));
  const source = clean(form.get("source"), 160);
  const location = clean(form.get("location"), 120);
  const email = clean(form.get("email"), 180).toLowerCase();

  if (!title) return NextResponse.json({ error: "Please add a title." }, { status: 400 });
  if (kind === "video" && embed && !toShowcaseEmbed(embed)) {
    return NextResponse.json({ error: "That doesn't look like a YouTube or Vimeo link." }, { status: 400 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("showcase_items").insert({
    kind,
    title,
    summary: summary || null,
    embed_url: embed || null,
    link_url: link || null,
    source: source || null,
    location: location || null,
    submitter_email: email || null,
    status: "pending",
  });
  if (error) {
    return NextResponse.json({ error: "Could not submit right now. Please try again." }, { status: 500 });
  }

  // Notify admin (best-effort).
  await sendEmail({
    to: adminEmail(),
    subject: `New showcase submission: ${title}`,
    text: `A new "${kind}" submission is awaiting review${source ? ` (from ${source})` : ""}.\n\nTitle: ${title}\n${link ? `Link: ${link}\n` : ""}${embed ? `Video: ${embed}\n` : ""}\nReview it in the admin dashboard:\n${siteUrl()}/admin`,
  });

  return NextResponse.json({ ok: true });
}
