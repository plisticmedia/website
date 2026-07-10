import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UserRole = "seller" | "admin";
export type AccountType = "buyer" | "business";

export type MfaStatus = {
  /** The account has at least one verified TOTP authenticator. */
  hasFactor: boolean;
  /** This session has been stepped up with a second factor (AAL2). */
  aal2: boolean;
};

/**
 * Reads the current session's multi-factor state: whether the account has a
 * verified authenticator, and whether *this* session has completed a second
 * factor. Used to enforce 2FA on admins. Fails safe (no factor / not stepped
 * up) if the MFA API is unavailable.
 */
export async function getMfaStatus(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<MfaStatus> {
  try {
    const [{ data: aal }, { data: factors }] = await Promise.all([
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      supabase.auth.mfa.listFactors(),
    ]);
    const verifiedTotp = (factors?.totp ?? []).filter((f) => f.status === "verified");
    return { hasFactor: verifiedTotp.length > 0, aal2: aal?.currentLevel === "aal2" };
  } catch {
    return { hasFactor: false, aal2: false };
  }
}

export type SessionProfile = {
  id: string;
  email: string | null;
  role: UserRole;
  /** How the account presents: a member of the public hiring, or a listed business. */
  accountType: AccountType;
  displayName: string | null;
};

/** Returns the signed-in user's profile, or null if logged out. */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Try with account_type; fall back to the pre-migration shape so a deploy that
  // lands before migration 0018 doesn't null the whole profile (which would drop
  // admin role and lock admins out). Everyone is treated as 'business' until then.
  let profile: { role?: string; account_type?: string; display_name?: string | null } | null = null;
  const withType = await supabase
    .from("profiles")
    .select("role, account_type, display_name")
    .eq("id", user.id)
    .single();
  if (withType.error) {
    const basic = await supabase.from("profiles").select("role, display_name").eq("id", user.id).single();
    profile = basic.data;
  } else {
    profile = withType.data;
  }

  return {
    id: user.id,
    email: user.email ?? null,
    role: (profile?.role as UserRole) ?? "seller",
    accountType: (profile?.account_type as AccountType) ?? "business",
    displayName: profile?.display_name ?? null,
  };
}

/** Redirects to /login if there is no signed-in user. */
export async function requireUser(nextPath = "/dashboard"): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return profile;
}

/**
 * Gates /admin: signed in, admin role, AND two-factor completed.
 * Admins with no authenticator are sent to set one up; admins who have one but
 * haven't stepped up this session are sent to the verify page. Every admin page
 * and mutating server action funnels through here, so 2FA is enforced platform-wide.
 */
export async function requireAdmin(): Promise<SessionProfile> {
  const profile = await requireUser("/admin");
  if (profile.role !== "admin") {
    redirect("/dashboard");
  }
  const supabase = await createSupabaseServerClient();
  const mfa = await getMfaStatus(supabase);
  if (!mfa.hasFactor) {
    redirect("/dashboard/security?admin=1");
  }
  if (!mfa.aal2) {
    redirect("/admin/verify");
  }
  return profile;
}

/**
 * Lighter admin gate for the step-up page itself: requires the admin role but
 * tolerates AAL1, so /admin/verify can render without redirecting to itself.
 */
export async function requireAdminRole(): Promise<SessionProfile> {
  const profile = await requireUser("/admin");
  if (profile.role !== "admin") {
    redirect("/dashboard");
  }
  return profile;
}

/**
 * Guard for admin API route handlers: returns the profile, or an error with the
 * HTTP status to send. Enforces admin role + AAL2 (2FA), matching requireAdmin.
 */
export async function getAdminApiContext(): Promise<
  { profile: SessionProfile } | { error: string; status: number }
> {
  const profile = await getSessionProfile();
  if (!profile) return { error: "Sign in required.", status: 401 };
  if (profile.role !== "admin") return { error: "Admins only.", status: 403 };
  const supabase = await createSupabaseServerClient();
  const mfa = await getMfaStatus(supabase);
  if (!mfa.hasFactor || !mfa.aal2) {
    return { error: "Two-factor authentication required.", status: 403 };
  }
  return { profile };
}
