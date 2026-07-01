import { NextResponse } from "next/server";
import { brand } from "@/data/site";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_LOGO_BYTES = 6 * 1024 * 1024; // 6 MB

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "listing";
}
function clean(v: FormDataEntryValue | null, max = 300) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/**
 * Public "list your business" submission. Uploads the logo to our own storage
 * and creates a *pending* listing (no owner) for an admin to review. Uses the
 * service role because submitters aren't signed in.
 */
export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Submissions aren't configured yet." }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Please submit the form again." }, { status: 400 });
  }

  // Honeypot: bots fill the hidden "company" field.
  if (clean(form.get("company"), 100)) return NextResponse.json({ ok: true });

  const title = clean(form.get("title"), 160);
  const email = clean(form.get("email"), 180).toLowerCase();
  const shortDesc = clean(form.get("description"), 2000);
  const website = clean(form.get("website"), 300);
  const address = clean(form.get("address"), 300);
  const postcode = clean(form.get("postcode"), 20);
  const serviceSlugs = form.getAll("services").map((v) => String(v)).filter(Boolean).slice(0, 20);
  const areaSlugs = form.getAll("areas").map((v) => String(v)).filter(Boolean).slice(0, 30);

  if (!title || !shortDesc || serviceSlugs.length === 0) {
    return NextResponse.json({ error: "Please add your name, a short description and at least one service." }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const social: Record<string, string> = {};
  for (const net of ["instagram", "linkedin", "facebook", "tiktok", "youtube", "other"]) {
    const v = clean(form.get(net), 300);
    if (v) social[net === "other" ? "link" : net] = v;
  }

  const supabase = createSupabaseServiceRoleClient();

  // Resolve chosen services/locations to ids (only existing taxa — no new sprawl).
  const [{ data: cats }, { data: locs }] = await Promise.all([
    supabase.from("categories").select("id, slug").in("slug", serviceSlugs),
    areaSlugs.length ? supabase.from("locations").select("id, slug").in("slug", areaSlugs) : Promise.resolve({ data: [] as { id: string; slug: string }[] }),
  ]);
  const catIds = ((cats ?? []) as Array<{ id: string }>).map((c) => c.id);
  const areaIds = ((locs ?? []) as Array<{ id: string }>).map((l) => l.id);
  if (catIds.length === 0) {
    return NextResponse.json({ error: "Please choose at least one service from the list." }, { status: 400 });
  }

  // Optional logo → our storage (public URL that always renders).
  let logoUrl: string | null = null;
  const logo = form.get("logo");
  if (logo && typeof logo === "object" && "size" in logo && logo.size > 0) {
    const file = logo as File;
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "The logo must be an image file." }, { status: 400 });
    }
    if (file.size > MAX_LOGO_BYTES) {
      return NextResponse.json({ error: "The logo is too large (max 6 MB)." }, { status: 400 });
    }
    const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
    const path = `submissions/${slugify(title)}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("service-media").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (upErr) {
      return NextResponse.json({ error: `Couldn't upload the logo: ${upErr.message}` }, { status: 502 });
    }
    logoUrl = supabase.storage.from("service-media").getPublicUrl(path).data.publicUrl;
  }

  // If the submitter is already signed in, they instantly own their listing;
  // otherwise we remember their email so signing in with it later auto-claims it.
  const owner = await getSessionProfile();

  const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 7)}`;
  const { data: inserted, error } = await supabase
    .from("services")
    .insert({
      seller_id: owner?.id ?? null,
      submitter_email: email || null,
      slug,
      status: "pending",
      is_featured: false,
      title,
      summary: shortDesc.slice(0, 280),
      description: shortDesc,
      category_id: catIds[0],
      location_id: areaIds[0] ?? null,
      website_url: website || null,
      address: address || null,
      postcode: postcode || null,
      social_links: social,
      logo_url: logoUrl,
      cover_image_url: logoUrl,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return NextResponse.json({ error: error?.message ?? "Couldn't save your listing." }, { status: 500 });
  }

  await supabase.from("listing_services").insert(catIds.map((cid) => ({ service_id: inserted.id, category_id: cid })));
  if (areaIds.length) {
    await supabase.from("service_areas").insert(areaIds.map((lid) => ({ service_id: inserted.id, location_id: lid })));
  }

  // Best-effort admin notification (never blocks the response).
  notifyAdmin(title, email).catch(() => {});

  return NextResponse.json({ ok: true });
}

async function notifyAdmin(title: string, email: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.EARN_NOTIFY_EMAIL ?? brand.email;
  const from = process.env.EARN_FROM_EMAIL ?? `Plistic <${brand.email}>`;
  if (!apiKey) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `New directory submission: ${title}`,
      text: `A new business submitted a directory listing (pending review in /admin).\n\nName: ${title}\nContact: ${email || "not provided"}`,
    }),
  });
}
