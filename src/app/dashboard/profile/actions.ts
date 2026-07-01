"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

const MAX_AVATAR_BYTES = 3 * 1024 * 1024; // 3 MB
const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/avif"];

function str(form: FormData, key: string, max: number) {
  const v = form.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function updateProfile(formData: FormData) {
  const profile = await requireUser("/dashboard/profile");
  const supabase = await createSupabaseServerClient();

  let website = str(formData, "website_url", 300);
  if (website && !/^https?:\/\//i.test(website)) {
    website = `https://${website}`;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: str(formData, "display_name", 120) || null,
      bio: str(formData, "bio", 1000) || null,
      website_url: website || null,
    })
    .eq("id", profile.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/profile");
}

export async function uploadAvatar(formData: FormData) {
  const profile = await requireUser("/dashboard/profile");
  const supabase = await createSupabaseServerClient();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Please choose an image.");
  if (file.size > MAX_AVATAR_BYTES) throw new Error("Avatar must be 3 MB or smaller.");
  if (!ALLOWED_IMAGE.includes(file.type)) throw new Error("Please upload a JPG, PNG, WebP or AVIF image.");

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  // Storage RLS requires the seller's uid as the top folder.
  const path = `${profile.id}/avatar/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("service-media")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  const { data: pub } = supabase.storage.from("service-media").getPublicUrl(path);
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: pub.publicUrl })
    .eq("id", profile.id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/profile");
}
