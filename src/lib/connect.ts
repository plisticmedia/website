import "server-only";
import { getStripe } from "@/lib/stripe";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

/**
 * Ask Stripe directly whether a connected account can take payments / receive
 * payouts, and sync those flags onto the seller's profile. This makes the
 * `account.updated` webhook a nice-to-have rather than a hard dependency for
 * knowing when onboarding is complete (webhooks can be missed or, for Connect,
 * need extra dashboard setup). Best-effort: returns the fresh flags, or null on
 * any failure so callers can fall back to the stored values.
 */
export async function syncConnectStatus(
  accountId: string,
): Promise<{ payouts_enabled: boolean; charges_enabled: boolean } | null> {
  try {
    const account = await getStripe().accounts.retrieve(accountId);
    const flags = {
      payouts_enabled: !!account.payouts_enabled,
      charges_enabled: !!account.charges_enabled,
    };
    const supabase = createSupabaseServiceRoleClient();
    await supabase.from("profiles").update(flags).eq("stripe_connect_account_id", accountId);
    return flags;
  } catch (err) {
    console.error("[connect] status sync failed", err);
    return null;
  }
}
