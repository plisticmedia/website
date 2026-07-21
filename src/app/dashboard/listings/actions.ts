"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { slugify } from "@/lib/services";
import { geocode, geocodeQuery } from "@/lib/geocode";
import { toEmbedUrl } from "@/lib/images";
import type { ServiceStatus } from "@/lib/types";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB (photos are resized in-browser before upload)
const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

function str(form: FormData, key: string, max = 2000) {
  const v = form.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Multi-select category ids (checkbox name="services"). */
function selectedServices(form: FormData) {
  return form
    .getAll("services")
    .filter((v): v is string => typeof v === "string" && v.length > 0);
}

/** Multi-select coverage-area location ids (checkbox name="areas"). */
function selectedAreas(form: FormData) {
  return form
    .getAll("areas")
    .filter((v): v is string => typeof v === "string" && v.length > 0);
}

/** Shared business-listing fields used by create + update. */
function listingFields(formData: FormData, categoryIds: string[], areaIds: string[]) {
  let website = str(formData, "website_url", 300);
  if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;

  let booking = str(formData, "booking_url", 300);
  if (booking && !/^https?:\/\//i.test(booking)) booking = `https://${booking}`;

  const social: Record<string, string> = {};
  const withScheme = (v: string) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v);
  for (const net of ["instagram", "linkedin", "youtube", "vimeo", "tiktok"] as const) {
    const v = str(formData, net, 200);
    if (v) social[net] = withScheme(v);
  }

  return {
    title: str(formData, "title", 140),
    listing_type: str(formData, "listing_type", 20) === "individual" ? "individual" : "business",
    summary: str(formData, "summary", 280) || null,
    description: str(formData, "description", 6000) || null,
    category_id: categoryIds[0] ?? (str(formData, "category_id", 80) || null),
    location_id: areaIds[0] ?? (str(formData, "location_id", 80) || null),
    website_url: website || null,
    booking_url: booking || null,
    address: str(formData, "address", 240) || null,
    postcode: str(formData, "postcode", 20) || null,
    credits: str(formData, "credits", 2000) || null,
    availability: str(formData, "availability", 400) || null,
    social_links: social,
  };
}

/** Best-effort geocode from address / postcode / location name -> lat,lng. */
async function resolveCoords(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  fields: { address: string | null; postcode: string | null; location_id: string | null },
): Promise<{ latitude: number; longitude: number } | Record<string, never>> {
  let locationName: string | null = null;
  if (fields.location_id) {
    const { data } = await supabase.from("locations").select("name").eq("id", fields.location_id).maybeSingle();
    locationName = (data?.name as string) ?? null;
  }
  const q = geocodeQuery({ address: fields.address, postcode: fields.postcode, location: locationName });
  const coords = await geocode(q);
  return coords ? { latitude: coords.lat, longitude: coords.lng } : {};
}

/** Replace a listing's service tags with the selected category ids. */
async function syncListingServices(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  serviceId: string,
  categoryIds: string[],
) {
  await supabase.from("listing_services").delete().eq("service_id", serviceId);
  if (categoryIds.length > 0) {
    await supabase
      .from("listing_services")
      .insert(categoryIds.map((cid) => ({ service_id: serviceId, category_id: cid })));
  }
}

/** Replace a listing's coverage areas ("operates in") with the selected location ids. */
async function syncServiceAreas(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  serviceId: string,
  areaIds: string[],
) {
  await supabase.from("service_areas").delete().eq("service_id", serviceId);
  if (areaIds.length > 0) {
    await supabase
      .from("service_areas")
      .insert(areaIds.map((lid) => ({ service_id: serviceId, location_id: lid })));
  }
}

export async function createListing(formData: FormData) {
  const profile = await requireUser("/dashboard/listings");
  const supabase = await createSupabaseServerClient();

  const categoryIds = selectedServices(formData);
  const areaIds = selectedAreas(formData);
  const fields = listingFields(formData, categoryIds, areaIds);
  if (!fields.title) throw new Error("A title is required.");

  const coords = await resolveCoords(supabase, fields);
  const { data, error } = await supabase
    .from("services")
    .insert({
      seller_id: profile.id,
      slug: slugify(fields.title),
      status: "draft" as ServiceStatus,
      ...fields,
      ...coords,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  await syncListingServices(supabase, data.id, categoryIds);
  await syncServiceAreas(supabase, data.id, areaIds);

  // Listing a service makes this a business account (reveals the seller tools).
  if (profile.accountType !== "business") {
    await supabase.from("profiles").update({ account_type: "business" }).eq("id", profile.id);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/listings");
  redirect(`/dashboard/listings/${data.id}`);
}

/**
 * Upgrade a buyer account to a business one, revealing the seller tools.
 * Used by the "List your business" action on a buyer's dashboard.
 */
export async function becomeBusiness() {
  const profile = await requireUser("/dashboard");
  const supabase = await createSupabaseServerClient();
  await supabase.from("profiles").update({ account_type: "business" }).eq("id", profile.id);
  revalidatePath("/dashboard");
  redirect("/dashboard/listings/new");
}

export async function updateListing(id: string, formData: FormData) {
  const profile = await requireUser("/dashboard/listings");
  const supabase = await createSupabaseServerClient();

  const categoryIds = selectedServices(formData);
  const areaIds = selectedAreas(formData);
  const fields = listingFields(formData, categoryIds, areaIds);
  if (!fields.title) throw new Error("A title is required.");

  const coords = await resolveCoords(supabase, fields);
  const { error } = await supabase
    .from("services")
    .update({ ...fields, ...coords })
    .eq("id", id)
    .eq("seller_id", profile.id);

  if (error) throw new Error(error.message);
  await syncListingServices(supabase, id, categoryIds);
  await syncServiceAreas(supabase, id, areaIds);

  revalidatePath(`/dashboard/listings/${id}`);
  revalidatePath("/dashboard/listings");
}

/**
 * Seller-controlled status changes. Sellers may move a listing to draft or
 * paused, or submit it for review (pending). Going live ("published") is an
 * admin moderation action only.
 */
export async function setListingStatus(id: string, status: ServiceStatus) {
  const profile = await requireUser("/dashboard/listings");
  const allowed: ServiceStatus[] = ["draft", "paused", "pending"];
  const next = allowed.includes(status) ? status : "pending";
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("services")
    .update({ status: next })
    .eq("id", id)
    .eq("seller_id", profile.id);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/listings/${id}`);
  revalidatePath("/dashboard/listings");
  revalidatePath("/directory");
}

export async function deleteListing(id: string) {
  const profile = await requireUser("/dashboard/listings");
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("seller_id", profile.id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/listings");
  redirect("/dashboard/listings");
}

export async function addPackage(serviceId: string, formData: FormData) {
  const profile = await requireUser("/dashboard/listings");
  const supabase = await createSupabaseServerClient();

  // Confirm ownership before writing the child row.
  const { data: owned } = await supabase
    .from("services")
    .select("id")
    .eq("id", serviceId)
    .eq("seller_id", profile.id)
    .maybeSingle();
  if (!owned) throw new Error("Listing not found.");

  const name = str(formData, "name", 120);
  if (!name) throw new Error("Package name is required.");

  const priceRaw = str(formData, "price_gbp", 20);
  const price = priceRaw ? Number(priceRaw) : null;
  const daysRaw = str(formData, "delivery_days", 10);
  const days = daysRaw ? parseInt(daysRaw, 10) : null;
  const features = str(formData, "features", 1000)
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);

  // "Bookable online" is only honoured once the seller can actually receive
  // payouts — otherwise we'd show a Book button we can't pay out against.
  const wantsBookable = formData.get("bookable") === "on";
  const bookable = wantsBookable && (await sellerPayoutsEnabled(supabase, profile.id));

  const { error } = await supabase.from("service_packages").insert({
    service_id: serviceId,
    name,
    price_gbp: price !== null && Number.isFinite(price) ? price : null,
    delivery_days: days !== null && Number.isFinite(days) ? days : null,
    features,
    is_bookable: bookable,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/listings/${serviceId}`);
  revalidatePath("/directory");
}

/** Whether the seller has completed Connect onboarding and can receive payouts. */
async function sellerPayoutsEnabled(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  sellerId: string,
): Promise<boolean> {
  const { data } = await supabase.from("profiles").select("payouts_enabled").eq("id", sellerId).maybeSingle();
  return !!data?.payouts_enabled;
}

/** Toggle a package's bookable-online flag (owner + payouts required to enable). */
export async function setPackageBookable(packageId: string, serviceId: string, bookable: boolean) {
  const profile = await requireUser("/dashboard/listings");
  const supabase = await createSupabaseServerClient();

  // Confirm ownership of the parent listing.
  const { data: owned } = await supabase
    .from("services")
    .select("id")
    .eq("id", serviceId)
    .eq("seller_id", profile.id)
    .maybeSingle();
  if (!owned) throw new Error("Listing not found.");

  const next = bookable ? await sellerPayoutsEnabled(supabase, profile.id) : false;

  const { error } = await supabase
    .from("service_packages")
    .update({ is_bookable: next })
    .eq("id", packageId)
    .eq("service_id", serviceId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/listings/${serviceId}`);
  revalidatePath("/directory");
}

export async function deletePackage(id: string, serviceId: string) {
  await requireUser("/dashboard/listings");
  const supabase = await createSupabaseServerClient();
  // RLS ensures only the owning seller can delete (policy checks parent service).
  const { error } = await supabase.from("service_packages").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/listings/${serviceId}`);
}

/**
 * Upload one OR many photos in a single call. Returns a serializable result
 * ({ uploaded, errors }) instead of throwing, so the client can show a gentle
 * inline message rather than crashing to the error page. Bad files are skipped
 * individually — a single dud never fails the whole batch.
 */
export async function uploadMedia(
  serviceId: string,
  formData: FormData,
): Promise<{ uploaded: number; errors: string[] }> {
  const profile = await requireUser("/dashboard/listings");
  const supabase = await createSupabaseServerClient();

  // Confirm ownership once.
  const { data: service } = await supabase
    .from("services")
    .select("id, cover_image_url")
    .eq("id", serviceId)
    .eq("seller_id", profile.id)
    .maybeSingle();
  if (!service) return { uploaded: 0, errors: ["Listing not found."] };

  const files = formData.getAll("file").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { uploaded: 0, errors: ["Please choose at least one photo."] };

  let coverUrl = service.cover_image_url as string | null;
  let uploaded = 0;
  const errors: string[] = [];

  for (const file of files) {
    if (file.size > MAX_UPLOAD_BYTES) {
      errors.push(`${file.name}: too large (max 15 MB).`);
      continue;
    }
    if (!ALLOWED_IMAGE.includes(file.type)) {
      errors.push(`${file.name}: not a supported image type.`);
      continue;
    }

    const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    // Storage RLS requires the seller's uid as the top folder. Include a counter
    // so several files uploaded within the same millisecond don't collide.
    const path = `${profile.id}/${serviceId}/${Date.now()}-${uploaded}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("service-media")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      errors.push(`${file.name}: ${uploadError.message}`);
      continue;
    }

    const { data: pub } = supabase.storage.from("service-media").getPublicUrl(path);
    const url = pub.publicUrl;

    const { error: rowError } = await supabase
      .from("service_media")
      .insert({ service_id: serviceId, url, kind: "image" });
    if (rowError) {
      errors.push(`${file.name}: ${rowError.message}`);
      continue;
    }

    // First image on the listing becomes the cover.
    if (!coverUrl) {
      coverUrl = url;
      await supabase.from("services").update({ cover_image_url: url }).eq("id", serviceId);
    }
    uploaded++;
  }

  revalidatePath(`/dashboard/listings/${serviceId}`);
  return { uploaded, errors };
}

/**
 * Add a showreel / video to the portfolio gallery from a YouTube, Vimeo or
 * Google Drive link. Stored as a `kind: "embed"` media row; the public profile
 * renders it as a responsive iframe. Returns a serializable result instead of
 * throwing, so the client can show a gentle inline message.
 */
export async function addEmbed(
  serviceId: string,
  formData: FormData,
): Promise<{ ok: boolean; error: string | null }> {
  const profile = await requireUser("/dashboard/listings");
  const supabase = await createSupabaseServerClient();

  const url = str(formData, "showreel", 400);
  if (!url) return { ok: false, error: "Please paste a video link." };
  if (!toEmbedUrl(url)) {
    return {
      ok: false,
      error: "That link isn't recognised. Paste a YouTube, Vimeo or Google Drive link.",
    };
  }

  // Confirm ownership before writing the child row.
  const { data: owned } = await supabase
    .from("services")
    .select("id")
    .eq("id", serviceId)
    .eq("seller_id", profile.id)
    .maybeSingle();
  if (!owned) return { ok: false, error: "Listing not found." };

  const { error } = await supabase
    .from("service_media")
    .insert({ service_id: serviceId, url, kind: "embed" });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/dashboard/listings/${serviceId}`);
  return { ok: true, error: null };
}

export async function deleteMedia(id: string, serviceId: string) {
  await requireUser("/dashboard/listings");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("service_media").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/listings/${serviceId}`);
}

/**
 * Upload (or replace) the listing's logo — the mark shown on directory cards and
 * at the top of the profile. Stored in our own Storage so it always renders
 * (unlike hot-linked Google Drive images).
 */
export async function uploadLogo(
  serviceId: string,
  formData: FormData,
): Promise<{ ok: boolean; error: string | null }> {
  const profile = await requireUser("/dashboard/listings");
  const supabase = await createSupabaseServerClient();

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Please choose a logo image to upload." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Logos must be 15 MB or smaller." };
  }
  if (!ALLOWED_IMAGE.includes(file.type)) {
    return { ok: false, error: "Please upload a JPG, PNG, WebP, AVIF or GIF image." };
  }

  // Confirm ownership.
  const { data: service } = await supabase
    .from("services")
    .select("id")
    .eq("id", serviceId)
    .eq("seller_id", profile.id)
    .maybeSingle();
  if (!service) return { ok: false, error: "Listing not found." };

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  // Storage RLS requires the seller's uid as the top folder.
  const path = `${profile.id}/${serviceId}/logo-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("service-media")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: pub } = supabase.storage.from("service-media").getPublicUrl(path);
  const { error } = await supabase
    .from("services")
    .update({ logo_url: pub.publicUrl })
    .eq("id", serviceId)
    .eq("seller_id", profile.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/dashboard/listings/${serviceId}`);
  revalidatePath("/directory");
  return { ok: true, error: null };
}

export async function removeLogo(serviceId: string) {
  const profile = await requireUser("/dashboard/listings");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("services")
    .update({ logo_url: null })
    .eq("id", serviceId)
    .eq("seller_id", profile.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/listings/${serviceId}`);
  revalidatePath("/directory");
}
