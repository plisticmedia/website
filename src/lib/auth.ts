import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UserRole = "seller" | "admin";

export type SessionProfile = {
  id: string;
  email: string | null;
  role: UserRole;
  displayName: string | null;
};

/** Returns the signed-in user's profile, or null if logged out. */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? null,
    role: (profile?.role as UserRole) ?? "seller",
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

/** Redirects non-admins away. Use to gate /admin. */
export async function requireAdmin(): Promise<SessionProfile> {
  const profile = await requireUser("/admin");
  if (profile.role !== "admin") {
    redirect("/dashboard");
  }
  return profile;
}
