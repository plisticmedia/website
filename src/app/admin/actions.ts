"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { geocode, geocodeQuery } from "@/lib/geocode";
import { sendEmail, siteUrl } from "@/lib/email";
import { getStripe } from "@/lib/stripe";
import { releaseOrder } from "@/lib/orders";
import type { ServiceStatus } from "@/lib/types";

/** Admin moderation: publish or remove any listing. RLS admin policy permits this. */
export async function moderateService(id: string, status: ServiceStatus) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("services").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/directory");
}

/**
 * Admin override: grant or revoke "Trusted partner" (featured) status for free.
 * Granting sets is_featured + a 1-year expiry; revoking clears both.
 * (The paid, self-serve version arrives with Stripe in Phase 5; this manual
 * grant is what lets the launch partners be featured at no cost.)
 */
export async function setFeatured(id: string, featured: boolean) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const featuredUntil = featured
    ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    : null;
  const { error } = await supabase
    .from("services")
    .update({ is_featured: featured, featured_until: featuredUntil })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/directory");
}

/**
 * Geocode a small batch of listings that have a location but no coordinates
 * (e.g. imported rows), so they appear on the directory map. Processes a few
 * per click (Nominatim allows ~1 req/sec) — run it a few times for large sets.
 */
export async function geocodeMissing() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("services")
    .select("id, address, postcode, locations!location_id(name)")
    .is("latitude", null)
    .not("location_id", "is", null)
    .limit(6);

  const rows = (data ?? []) as unknown as Array<{
    id: string; address: string | null; postcode: string | null; locations: { name: string } | null;
  }>;

  for (const r of rows) {
    const q = geocodeQuery({ address: r.address, postcode: r.postcode, location: r.locations?.name ?? null });
    if (!q) continue;
    const coords = await geocode(q);
    if (coords) {
      await supabase.from("services").update({ latitude: coords.lat, longitude: coords.lng }).eq("id", r.id);
    }
    await new Promise((res) => setTimeout(res, 1100)); // respect Nominatim rate limit
  }

  revalidatePath("/admin");
  revalidatePath("/directory");
}

/**
 * Clear a wrong/unwanted Google rating from a listing and stop it being
 * auto-matched again (place id set to the "SKIP" sentinel). Use when the
 * automatic match latched onto the wrong business.
 */
export async function clearRating(id: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("services")
    .update({
      google_place_id: "SKIP",
      google_rating: null,
      google_rating_count: null,
      google_rating_updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/directory");
}

/** Re-enable automatic Google matching for a listing previously cleared. */
export async function recheckRating(id: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("services")
    .update({ google_place_id: null, google_rating: null, google_rating_count: null, google_rating_updated_at: null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

// ---------------------------------------------------------------------------
// Claim-a-listing moderation
// ---------------------------------------------------------------------------
export async function approveClaim(claimId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: claim } = await supabase
    .from("claims")
    .select("id, service_id, claimant_user_id")
    .eq("id", claimId)
    .maybeSingle();
  if (!claim) throw new Error("Claim not found.");

  // Assign ownership, then mark the claim approved.
  const { error: ownErr } = await supabase
    .from("services")
    .update({ seller_id: claim.claimant_user_id })
    .eq("id", claim.service_id);
  if (ownErr) throw new Error(ownErr.message);

  const { error } = await supabase.from("claims").update({ status: "approved" }).eq("id", claimId);
  if (error) throw new Error(error.message);

  // Let the business know they now own the listing.
  try {
    const service = createSupabaseServiceRoleClient();
    const [{ data: svc }, { data: userRes }] = await Promise.all([
      service.from("services").select("title").eq("id", claim.service_id).maybeSingle(),
      service.auth.admin.getUserById(claim.claimant_user_id),
    ]);
    const email = userRes?.user?.email;
    if (email) {
      await sendEmail({
        to: email,
        subject: `Your Plistic listing is approved${svc?.title ? `: ${svc.title}` : ""}`,
        text: `Good news — your claim has been approved. You can now edit your profile, add photos and a showreel, and receive enquiries here:\n\n${siteUrl()}/dashboard/listings\n\nThanks,\nPlistic`,
      });
    }
  } catch (e) {
    console.error("[approveClaim] notify failed", e);
  }
  revalidatePath("/admin");
}

/** Admin: toggle the free "Verified" trust badge (distinct from paid featured). */
export async function setVerified(id: string, verified: boolean) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("services").update({ verified }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/directory");
  revalidatePath("/showcase");
}

/** Admin: toggle "Founding partner" status (curated launch cohort). */
export async function setFounding(id: string, founding: boolean) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("services").update({ founding }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/directory");
  revalidatePath("/showcase");
}

/** Admin: release ownership of a listing (back to unclaimed). Undoes a claim. */
export async function releaseOwner(id: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("services").update({ seller_id: null }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/directory");
}

/** Remove someone's admin access (demote to a normal seller account). */
export async function revokeAdmin(userId: string) {
  const me = await requireAdmin();
  if (userId === me.id) throw new Error("You can't remove your own admin access.");
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("profiles").update({ role: "seller" }).eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

/** Grant admin access to an existing account by email. */
export type AdminActionResult = { ok: boolean; message: string };

export async function grantAdmin(
  _prev: AdminActionResult | null,
  formData: FormData,
): Promise<AdminActionResult> {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { ok: false, message: "Enter an email address." };
  const supabase = createSupabaseServiceRoleClient();
  // Find the signed-up account with this email.
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = list?.users?.find((u: { email?: string | null }) => (u.email ?? "").toLowerCase() === email);
  if (!user) {
    return {
      ok: false,
      message: `No account found for ${email} yet. Ask them to create an account first at plisticmedia.com/login, then grant access.`,
    };
  }
  const { error } = await supabase.from("profiles").update({ role: "admin" }).eq("id", user.id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin");
  return {
    ok: true,
    message: `${email} is now an admin. Next time they open /admin they'll be asked to set up their own 2FA.`,
  };
}

/**
 * Resolve a dispute by refunding the buyer. Because the escrow model never
 * transferred the funds (they're still on the platform balance), a straight
 * refund on the payment intent returns the full amount. SECURITY-SENSITIVE.
 */
export async function refundDispute(orderId: string, formData?: FormData) {
  await requireAdmin();
  const supabase = createSupabaseServiceRoleClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, stripe_payment_intent_id, service_id, buyer_email, seller_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.status !== "disputed") throw new Error("Order isn't in dispute.");
  if (!order.stripe_payment_intent_id) throw new Error("No payment to refund.");

  // Idempotency key guards against a double refund on a double-click.
  await getStripe().refunds.create(
    { payment_intent: order.stripe_payment_intent_id as string },
    { idempotencyKey: `order_refund_${orderId}` },
  );

  const note = typeof formData?.get("note") === "string" ? String(formData.get("note")).slice(0, 1000) : null;
  await supabase.from("orders").update({ status: "refunded" }).eq("id", orderId);
  await supabase
    .from("disputes")
    .update({ status: "resolved_refund", resolved_at: new Date().toISOString(), resolution_note: note })
    .eq("order_id", orderId);
  await supabase.from("order_events").insert({ order_id: orderId, type: "refunded", data: { note } });

  if (order.buyer_email) {
    void sendEmail({
      to: order.buyer_email as string,
      subject: "Your Plistic order has been refunded",
      text: `We've refunded your order in full. It can take a few days to appear on your statement.`,
    }).catch(() => {});
  }
  revalidatePath("/admin");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/sales");
}

/**
 * Resolve a dispute in the seller's favour: release the held funds to them.
 * Reuses the shared escrow release. SECURITY-SENSITIVE.
 */
export async function releaseDispute(orderId: string, formData?: FormData) {
  await requireAdmin();
  const supabase = createSupabaseServiceRoleClient();

  const { data: order } = await supabase.from("orders").select("id, status").eq("id", orderId).maybeSingle();
  if (!order || order.status !== "disputed") throw new Error("Order isn't in dispute.");

  // releaseOrder acts on a `delivered` order; move it there first.
  await supabase.from("orders").update({ status: "delivered" }).eq("id", orderId);
  const res = await releaseOrder(orderId);
  if (!res.ok) {
    // Put it back into dispute so it isn't left half-resolved.
    await supabase.from("orders").update({ status: "disputed" }).eq("id", orderId);
    throw new Error(res.error ?? "Couldn't release the order.");
  }

  const note = typeof formData?.get("note") === "string" ? String(formData.get("note")).slice(0, 1000) : null;
  await supabase
    .from("disputes")
    .update({ status: "resolved_release", resolved_at: new Date().toISOString(), resolution_note: note })
    .eq("order_id", orderId);

  revalidatePath("/admin");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/sales");
}

export async function rejectClaim(claimId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("claims").update({ status: "rejected" }).eq("id", claimId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

// ---------------------------------------------------------------------------
// Editable taxonomy: service categories + locations (no deploy needed)
// ---------------------------------------------------------------------------
type Taxon = "categories" | "locations";

function taxonSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function str(form: FormData, key: string, max = 120) {
  const v = form.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function createTaxon(kind: Taxon, formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const name = str(formData, "name", 120);
  if (!name) throw new Error("A name is required.");
  const sortRaw = str(formData, "sort_order", 8);
  const sort_order = sortRaw ? parseInt(sortRaw, 10) || 0 : 0;

  const { error } = await supabase
    .from(kind)
    .insert({ name, slug: taxonSlug(name), sort_order });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/taxonomy");
  revalidatePath("/directory");
}

export async function renameTaxon(kind: Taxon, id: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const name = str(formData, "name", 120);
  if (!name) throw new Error("A name is required.");
  const sortRaw = str(formData, "sort_order", 8);
  const update: { name: string; sort_order?: number } = { name };
  if (sortRaw) update.sort_order = parseInt(sortRaw, 10) || 0;

  const { error } = await supabase.from(kind).update(update).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/taxonomy");
  revalidatePath("/directory");
}

export async function deleteTaxon(kind: Taxon, id: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  // FKs are ON DELETE SET NULL / CASCADE, so listings simply lose this tag.
  const { error } = await supabase.from(kind).delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/taxonomy");
  revalidatePath("/directory");
}

/** Approve a submitted showcase item (make it public). */
export async function publishShowcaseItem(id: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("showcase_items")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/showcase");
}

/** Reject / remove a showcase item. */
export async function removeShowcaseItem(id: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("showcase_items").update({ status: "removed" }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/showcase");
}

/** Toggle whether a showcase item is featured (shown large / first). */
export async function toggleShowcaseFeatured(id: string, featured: boolean) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("showcase_items").update({ is_featured: featured }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/showcase");
}

const SHOWCASE_KINDS = ["video", "image", "event", "news", "work"] as const;
const SHOWCASE_IMG = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const SHOWCASE_MAX = 8 * 1024 * 1024; // 8 MB

/**
 * Create or edit a showcase story with no code: all fields plus an optional
 * image upload (stored in our own Storage). Admin-created stories publish
 * immediately; editing a pending submission and saving also publishes it.
 */
export async function saveShowcaseItem(id: string | null, formData: FormData) {
  await requireAdmin();
  const supabase = createSupabaseServiceRoleClient();

  const str = (k: string, max: number) => {
    const v = formData.get(k);
    return typeof v === "string" ? v.trim().slice(0, max) : "";
  };

  const title = str("title", 200);
  if (!title) throw new Error("A title is required.");

  const kindRaw = str("kind", 20);
  const kind = (SHOWCASE_KINDS as readonly string[]).includes(kindRaw) ? kindRaw : "news";

  // Optional image upload → our Storage. Falls back to a pasted image URL.
  let imageUrl = str("image_url", 600) || null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    if (file.size > SHOWCASE_MAX) throw new Error("Image must be 8 MB or smaller.");
    if (!SHOWCASE_IMG.includes(file.type)) throw new Error("Please upload a JPG, PNG, WebP, AVIF or GIF image.");
    const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `showcase/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("service-media")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) throw new Error(upErr.message);
    imageUrl = supabase.storage.from("service-media").getPublicUrl(path).data.publicUrl;
  }

  const eventDate = str("event_date", 20);
  const record: Record<string, unknown> = {
    kind,
    title,
    summary: str("summary", 400) || null,
    body: str("body", 8000) || null,
    embed_url: str("embed_url", 600) || null,
    link_url: str("link_url", 600) || null,
    source: str("source", 160) || null,
    location: str("location", 160) || null,
    event_date: eventDate || null,
    is_featured: formData.get("is_featured") === "on",
    status: "published",
  };
  if (imageUrl !== null) record.image_url = imageUrl;

  if (id) {
    const { error } = await supabase.from("showcase_items").update(record).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    record.published_at = new Date().toISOString();
    const { error } = await supabase.from("showcase_items").insert(record);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/showcase");
  revalidatePath("/showcase");
  redirect("/admin/showcase?saved=1");
}
