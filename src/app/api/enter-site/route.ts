import { NextResponse } from "next/server";
import { SPLASH_SEEN_COOKIE } from "@/lib/siteAccess";

export const runtime = "nodejs";

/**
 * "Continue to our website" from the coming-soon splash: remember that the
 * visitor has moved past the splash (so the bare homepage stops redirecting to
 * it) and send them to the homepage.
 */
export function GET(request: Request) {
  const res = NextResponse.redirect(new URL("/", request.url));
  res.cookies.set(SPLASH_SEEN_COOKIE, "1", {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
  return res;
}
