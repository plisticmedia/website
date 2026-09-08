"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { normaliseCode, DISCOUNT_SERVICE_LABELS, type DiscountService } from "@/lib/discounts";

export type DiscountActionResult = { ok: boolean; message: string };

const SERVICES = Object.keys(DISCOUNT_SERVICE_LABELS) as DiscountService[];

/** Create a new discount / quote code. */
export async function createDiscountCode(
  _prev: DiscountActionResult | null,
  formData: FormData,
): Promise<DiscountActionResult> {
  await requireAdmin();

  const code = normaliseCode(String(formData.get("code") ?? ""));
  if (!code) return { ok: false, message: "Enter a code." };
  if (!/^[A-Z0-9][A-Z0-9-]{1,30}$/.test(code)) {
    return { ok: false, message: "Codes can use letters, numbers and hyphens (2–31 characters)." };
  }

  const label = String(formData.get("label") ?? "").trim().slice(0, 120) || null;

  const discountType = String(formData.get("discountType") ?? "percent") === "fixed" ? "fixed" : "percent";
  const discountValue = Number(formData.get("discountValue"));
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return { ok: false, message: "Enter a discount amount greater than zero." };
  }
  if (discountType === "percent" && discountValue > 100) {
    return { ok: false, message: "A percentage discount can't be more than 100%." };
  }

  const service = SERVICES.includes(String(formData.get("service")) as DiscountService)
    ? (String(formData.get("service")) as DiscountService)
    : "all";

  const expiresRaw = String(formData.get("expiresAt") ?? "").trim();
  let expiresAt: string | null = null;
  if (expiresRaw) {
    // A date input gives YYYY-MM-DD; treat the code as valid through end of that day.
    const d = new Date(`${expiresRaw}T23:59:59`);
    if (Number.isNaN(d.getTime())) return { ok: false, message: "That expiry date isn't valid." };
    expiresAt = d.toISOString();
  }

  const maxUsesRaw = String(formData.get("maxUses") ?? "").trim();
  let maxUses: number | null = null;
  if (maxUsesRaw) {
    const n = Number(maxUsesRaw);
    if (!Number.isInteger(n) || n < 1) return { ok: false, message: "Max uses must be a whole number, or left blank for unlimited." };
    maxUses = n;
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("discount_codes").insert({
    code,
    label,
    discount_type: discountType,
    discount_value: discountValue,
    service,
    expires_at: expiresAt,
    max_uses: maxUses,
  });

  if (error) {
    if (error.code === "23505" || /duplicate|unique/i.test(error.message)) {
      return { ok: false, message: `The code ${code} already exists.` };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/discount-codes");
  return { ok: true, message: `Created ${code}.` };
}

/** Turn a code on or off without deleting it. */
export async function setDiscountActive(id: string, active: boolean): Promise<void> {
  await requireAdmin();
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("discount_codes").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/discount-codes");
}

/** Permanently remove a code. */
export async function deleteDiscountCode(id: string): Promise<void> {
  await requireAdmin();
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("discount_codes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/discount-codes");
}
