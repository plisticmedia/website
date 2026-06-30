"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { slugify } from "@/lib/services";
import type { ServiceStatus } from "@/lib/types";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

function str(form: FormData, key: string, max = 2000) {
  const v = form.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function createListing(formData: FormData) {
  const profile = await requireUser("/dashboard/listings");
  const supabase = await createSupabaseServerClient();

  const title = str(formData, "title", 140);
  if (!title) throw new Error("A title is required.");

  const categoryId = str(formData, "category_id", 80) || null;

  const { data, error } = await supabase
    .from("services")
    .insert({
      seller_id: profile.id,
      title,
      slug: slugify(title),
      summary: str(formData, "summary", 280) || null,
      description: str(formData, "description", 6000) || null,
      category_id: categoryId,
      status: "draft" as ServiceStatus,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/listings");
  redirect(`/dashboard/listings/${data.id}`);
}

export async function updateListing(id: string, formData: FormData) {
  const profile = await requireUser("/dashboard/listings");
  const supabase = await createSupabaseServerClient();

  const title = str(formData, "title", 140);
  if (!title) throw new Error("A title is required.");

  const { error } = await supabase
    .from("services")
    .update({
      title,
      summary: str(formData, "summary", 280) || null,
      description: str(formData, "description", 6000) || null,
      category_id: str(formData, "category_id", 80) || null,
    })
    .eq("id", id)
    .eq("seller_id", profile.id);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/listings/${id}`);
  revalidatePath("/dashboard/listings");
}

export async function setListingStatus(id: string, status: ServiceStatus) {
  const profile = await requireUser("/dashboard/listings");
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("services")
    .update({ status })
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
