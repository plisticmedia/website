import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { SITE_ACCESS_COOKIE, SITE_ACCESS_COOKIE_VALUE } from "@/lib/siteAccess";

// Paths reachable without the coming-soon password.
const publicPaths = new Set([
  "/coming-soon",
  "/api/site-access",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
]);
// Prefixes always allowed: framework assets, static assets, and the auth
// callback/confirm routes (so magic-link sign-in resolves even before the gate cookie).
const publicPrefixes = ["/_next/", "/assets/", "/auth/"];

function isPublicPath(pathname: string) {
  return publicPaths.has(pathname) || publicPrefixes.some((p) => pathname.startsWith(p));
}

function hasSiteAccess(request: NextRequest) {
  return request.cookies.get(SITE_ACCESS_COOKIE)?.value === SITE_ACCESS_COOKIE_VALUE;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1) Coming-soon gate: until launch, hold the whole site behind the password.
  if (!isPublicPath(pathname) && !hasSiteAccess(request)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/coming-soon";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(redirectUrl);
  }

  // 2) Refresh the Supabase session and gate /dashboard and /admin.
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
