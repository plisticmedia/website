"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { slugify } from "@/lib/services";
import { geocode, geocodeQuery } from "@/lib/geocode";
import type { ServiceStatus } from "@/lib/types";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
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

  const social: Record<string, string> = {};
  const instagram = str(formData, "instagram", 200);
  const linkedin = str(formData, "linkedin", 200);
  if (instagram) social.instagram = instagram;
  if (linkedin) social.linkedin = linkedin;

  return {
    title: str(formData, "title", 140),
    summary: str(formData, "summary", 280) || null,
    description: str(formData, "description", 6000) || null,
    category_id: categoryIds[0] ?? (str(formData, "category_id", 80) || null),
    location_id: areaIds[0] ?? (str(formData, "location_id", 80) || null),
    website_url: website || null,
    address: str(formData, "address", 240) || null,
    postcode: str(formData, "postcode", 20) || null,
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

  revalidatePath("/dashboard/listings");
  redirect(`/dashboard/listings/${data.id}`);
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

  const { error } = await supabase.from("service_packages").insert({
    service_id: serviceId,
    name,
    price_gbp: price !== null && Number.isFinite(price) ? price : null,
    delivery_days: days !== null && Number.isFinite(days) ? days : null,
    features,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/listings/${serviceId}`);
}

export async function deletePackage(id: string, serviceId: string) {
  await requireUser("/dashboard/listings");
  const supabase = await createSupabaseServerClient();
  // RLS ensures only the owning seller can delete (policy checks parent service).
  const { error } = await supabase.from("service_packages").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/listings/${serviceId}`);
}

export async function uploadMedia(serviceId: string, formData: FormData) {
  const profile = await requireUser("/dashboard/listings");
  const supabase = await createSupabaseServerClient();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Please choose an image to upload.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Images must be 5 MB or smaller.");
  }
  if (!ALLOWED_IMAGE.includes(file.type)) {
    throw new Error("Please upload a JPG, PNG, WebP, AVIF or GIF image.");
  }

  // Confirm ownership.
  const { data: service } = await supabase
    .from("services")
    .select("id, cover_image_url")
    .eq("id", serviceId)
    .eq("seller_id", profile.id)
    .maybeSingle();
  if (!service) throw new Error("Listing not found.");

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  // Storage RLS requires the seller's uid as the top folder.
  const path = `${profile.id}/${serviceId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("service-media")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error(uploadError.message);

  const { data: pub } = supabase.storage.from("service-media").getPublicUrl(path);
  const url = pub.publicUrl;

  const { error: rowError } = await supabase
    .from("service_media")
    .insert({ service_id: serviceId, url, kind: "image" });
  if (rowError) throw new Error(rowError.message);

  // First image becomes the cover.
  if (!service.cover_image_url) {
    await supabase.from("services").update({ cover_image_url: url }).eq("id", serviceId);
  }

  revalidatePath(`/dashboard/listings/${serviceId}`);
}

export async function deleteMedia(id: string, serviceId: string) {
  await requireUser("/dashboard/listings");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("service_media").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/listings/${serviceId}`);
}
