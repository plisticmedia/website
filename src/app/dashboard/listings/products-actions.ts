"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB (photos are resized in-browser first)
const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

function str(form: FormData, key: string, max = 4000) {
  const v = form.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function num(form: FormData, key: string): number | null {
  const v = form.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

type DB = SupabaseClient;

/** True if the seller owns the listing this product hangs off. */
async function ownsService(supabase: DB, serviceId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("services")
    .select("id")
    .eq("id", serviceId)
    .eq("seller_id", userId)
    .maybeSingle();
  return !!data;
}

/** True if the product exists AND belongs to the (owned) listing. */
async function ownsProduct(supabase: DB, serviceId: string, productId: string, userId: string): Promise<boolean> {
  if (!(await ownsService(supabase, serviceId, userId))) return false;
  const { data } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("service_id", serviceId)
    .maybeSingle();
  return !!data;
}

function productType(form: FormData): "physical" | "service" {
  return str(form, "product_type", 20) === "service" ? "service" : "physical";
}

function fulfilment(form: FormData): "shipping" | "collection" | "both" | null {
  const v = str(form, "fulfilment", 20);
  return v === "shipping" || v === "collection" || v === "both" ? v : null;
}

function status(form: FormData): "draft" | "active" {
  return str(form, "status", 20) === "active" ? "active" : "draft";
}

/** Create a draft item and jump straight to its edit page. */
export async function createProduct(serviceId: string, formData: FormData) {
  const profile = await requireUser("/dashboard/listings");
  const supabase = await createSupabaseServerClient();
  if (!(await ownsService(supabase, serviceId, profile.id))) throw new Error("Listing not found.");

  const title = str(formData, "title", 160);
  if (!title) throw new Error("Please give the item a name.");

  const { data, error } = await supabase
    .from("products")
    .insert({
      service_id: serviceId,
      title,
      price_gbp: num(formData, "price_gbp"),
      product_type: productType(formData),
      status: "draft",
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Couldn't create the item.");

  revalidatePath(`/dashboard/listings/${serviceId}`);
  redirect(`/dashboard/listings/${serviceId}/products/${data.id}`);
}

/** Update all editable fields of an item. */
export async function updateProduct(serviceId: string, productId: string, formData: FormData) {
  const profile = await requireUser("/dashboard/listings");
  const supabase = await createSupabaseServerClient();
  if (!(await ownsProduct(supabase, serviceId, productId, profile.id))) throw new Error("Item not found.");

  const title = str(formData, "title", 160);
  if (!title) throw new Error("Please give the item a name.");

  const { error } = await supabase
    .from("products")
    .update({
      title,
      description: str(formData, "description", 6000) || null,
      price_gbp: num(formData, "price_gbp"),
      product_type: productType(formData),
      stock: num(formData, "stock"),
      fulfilment: fulfilment(formData),
      delivery_info: str(formData, "delivery_info", 600) || null,
      status: status(formData),
    })
    .eq("id", productId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/listings/${serviceId}/products/${productId}`);
  revalidatePath(`/dashboard/listings/${serviceId}`);
}

export async function deleteProduct(serviceId: string, productId: string) {
  const profile = await requireUser("/dashboard/listings");
  const supabase = await createSupabaseServerClient();
  if (!(await ownsProduct(supabase, serviceId, productId, profile.id))) throw new Error("Item not found.");

  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/listings/${serviceId}`);
  redirect(`/dashboard/listings/${serviceId}`);
}

/** Upload one or many photos for an item. Returns { uploaded, errors }. */
export async function uploadProductPhotos(
  serviceId: string,
  productId: string,
  formData: FormData,
): Promise<{ uploaded: number; errors: string[] }> {
  const profile = await requireUser("/dashboard/listings");
  const supabase = await createSupabaseServerClient();
  if (!(await ownsProduct(supabase, serviceId, productId, profile.id))) {
    return { uploaded: 0, errors: ["Item not found."] };
  }

  const files = formData.getAll("file").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { uploaded: 0, errors: ["Please choose at least one photo."] };

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
    const path = `${profile.id}/products/${productId}/${Date.now()}-${uploaded}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("service-media")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) {
      errors.push(`${file.name}: ${upErr.message}`);
      continue;
    }
    const { data: pub } = supabase.storage.from("service-media").getPublicUrl(path);
    const { error: rowErr } = await supabase
      .from("product_media")
      .insert({ product_id: productId, url: pub.publicUrl, sort_order: uploaded });
    if (rowErr) {
      errors.push(`${file.name}: ${rowErr.message}`);
      continue;
    }
    uploaded++;
  }

  revalidatePath(`/dashboard/listings/${serviceId}/products/${productId}`);
  return { uploaded, errors };
}

export async function deleteProductPhoto(serviceId: string, productId: string, mediaId: string) {
  const profile = await requireUser("/dashboard/listings");
  const supabase = await createSupabaseServerClient();
  if (!(await ownsProduct(supabase, serviceId, productId, profile.id))) throw new Error("Item not found.");

  const { error } = await supabase.from("product_media").delete().eq("id", mediaId).eq("product_id", productId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/listings/${serviceId}/products/${productId}`);
}
