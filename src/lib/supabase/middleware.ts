import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SITE_ACCESS_COOKIE, SITE_ACCESS_COOKIE_VALUE } from "@/lib/siteAccess";

/**
 * Refreshes the Supabase auth session on every request and gates the
 * authenticated areas of the site. Public pages stay open.
 *
 * If the Supabase env vars are not configured yet, this is a no-op so the
 * marketing site keeps working before the backend accounts exist.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: do not run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdmin = pathname.startsWith("/admin");
  const isProtected = pathname.startsWith("/dashboard") || isAdmin;

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Defence in depth: /admin requires the admin role at the edge too, so it's
  // protected even if a page ever forgot its own requireAdmin() guard.
  if (isAdmin && user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Grant Media Directory access to signed-in beta testers / admins by setting
  // the site-access cookie once — cached thereafter, so this extra profile read
  // runs roughly once per session (only while the cookie is missing).
  if (user && request.cookies.get(SITE_ACCESS_COOKIE)?.value !== SITE_ACCESS_COOKIE_VALUE) {
    const { data: access, error } = await supabase
      .from("profiles")
      .select("role, beta_access")
      .eq("id", user.id)
      .single();
    // Fall back to role-only if beta_access doesn't exist yet (deploy before the
    // migration) so admins are never locked out of the directory.
    let eligible = access?.role === "admin" || access?.beta_access === true;
    if (error) {
      const basic = await supabase.from("profiles").select("role").eq("id", user.id).single();
      eligible = basic.data?.role === "admin";
    }
    if (eligible) {
      response.cookies.set(SITE_ACCESS_COOKIE, SITE_ACCESS_COOKIE_VALUE, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 90,
      });
    }
  }

  return response;
}
