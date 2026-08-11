import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { SITE_ACCESS_COOKIE, SITE_ACCESS_COOKIE_VALUE } from "@/lib/siteAccess";

// Paths reachable without the coming-soon password.
const publicPaths = new Set([
  "/coming-soon",
  "/api/site-access",
  "/api/beta-signup",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  // Public sign-up funnel: businesses can list themselves before public launch.
  "/list-your-business",
  "/api/submit-listing",
  // Password reset must always resolve, even without the coming-soon cookie.
  "/reset-password",
]);
// Prefixes always allowed: framework assets, static assets, the auth
// callback/confirm routes (so magic-link sign-in resolves even before the gate
// cookie), and server-to-server endpoints hit by external callers with no
// browser cookie (scheduled cron, inbound webhooks). Those enforce their own
// auth (CRON_SECRET / webhook signatures).
const publicPrefixes = ["/_next/", "/assets/", "/auth/", "/api/cron/", "/api/webhooks/", "/claim/"];

function isPublicPath(pathname: string) {
  return publicPaths.has(pathname) || publicPrefixes.some((p) => pathname.startsWith(p));
}

function hasSiteAccess(request: NextRequest) {
  return request.cookies.get(SITE_ACCESS_COOKIE)?.value === SITE_ACCESS_COOKIE_VALUE;
}

// The Media Directory + price comparison sit behind the coming-soon/beta gate.
function isDirectoryPath(pathname: string) {
  return (
    pathname === "/directory" ||
    pathname.startsWith("/directory/") ||
    pathname === "/compare" ||
    pathname.startsWith("/compare/")
  );
}

// Two launch switches, both default OFF:
//  - SITE_LIVE=true      → the whole site is public (lifts the pre-launch gate).
//  - DIRECTORY_LIVE=true → the directory + compare are public too.
// So the intended live-but-directory-still-in-beta state is SITE_LIVE=true with
// DIRECTORY_LIVE unset: everything public except the directory, which stays
// behind the beta password until the directory itself is ready.
const SITE_LIVE = process.env.SITE_LIVE === "true";
const DIRECTORY_LIVE = process.env.DIRECTORY_LIVE === "true";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1) Coming-soon / beta gate. Gate a page when it isn't public, the visitor
  //    hasn't entered the password, AND either the whole site is pre-launch OR
  //    it's a directory page and the directory isn't live yet.
  const gated =
    !isPublicPath(pathname) &&
    !hasSiteAccess(request) &&
    (!SITE_LIVE || (!DIRECTORY_LIVE && isDirectoryPath(pathname)));

  if (gated) {
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
