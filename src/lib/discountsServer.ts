import "server-only";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { normaliseCode, type DiscountInfo } from "@/lib/discounts";

type DiscountRow = {
  id: string;
  code: string;
  label: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  service: string;
  active: boolean;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
};

export type ValidateResult =
  | { valid: true; id: string; info: DiscountInfo }
  | { valid: false; reason: string };

/**
 * Look a code up and confirm it's usable for the given estimator service.
 * Runs with the service role (there's no public RLS read policy on the table),
 * so keep the returned shape minimal — never leak the whole row to the client.
 */
export async function validateDiscountCode(rawCode: string, service: string): Promise<ValidateResult> {
  const code = normaliseCode(rawCode);
  if (!code) return { valid: false, reason: "Enter a code." };

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("discount_codes")
    .select("id, code, label, discount_type, discount_value, service, active, expires_at, max_uses, used_count")
    .eq("code", code)
    .maybeSingle();

  if (error || !data) return { valid: false, reason: "That code isn't recognised." };

  const row = data as DiscountRow;

  if (!row.active) return { valid: false, reason: "That code is no longer active." };
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    return { valid: false, reason: "That code has expired." };
  }
  if (row.max_uses != null && row.used_count >= row.max_uses) {
    return { valid: false, reason: "That code has been fully redeemed." };
  }
  if (row.service !== "all" && row.service !== service) {
    return { valid: false, reason: "That code doesn't apply to this service." };
  }

  return {
    valid: true,
    id: row.id,
    info: {
      code: row.code,
      label: row.label,
      discountType: row.discount_type,
      discountValue: Number(row.discount_value),
    },
  };
}

/** Increment a code's redemption count. Best-effort — never throws. */
export async function recordDiscountUse(id: string): Promise<void> {
  try {
    const supabase = createSupabaseServiceRoleClient();
    await supabase.rpc("increment_discount_use", { p_id: id });
  } catch (err) {
    console.error("[discounts] recordDiscountUse failed", err);
  }
}
