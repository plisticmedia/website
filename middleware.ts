import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SITE_ACCESS_COOKIE, SITE_ACCESS_COOKIE_VALUE } from "./src/lib/siteAccess";

const publicPathPrefixes = ["/_next/", "/assets/"];
const publicPaths = new Set(["/coming-soon", "/api/site-access", "/favicon.ico", "/robots.txt", "/sitemap.xml"]);

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname) || hasSiteAccess(request)) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/coming-soon";
  redirectUrl.search = "";
  redirectUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(redirectUrl);
}

function isPublicPath(pathname: string) {
  return publicPaths.has(pathname) || publicPathPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function hasSiteAccess(request: NextRequest) {
  return request.cookies.get(SITE_ACCESS_COOKIE)?.value === SITE_ACCESS_COOKIE_VALUE;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
