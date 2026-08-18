import { NextRequest, NextResponse } from "next/server";
import { SITE_ACCESS_COOKIE, SITE_ACCESS_COOKIE_VALUE, verifySiteAccessPassword } from "@/lib/siteAccess";
import { rateLimit, clientIp } from "@/lib/rateLimit";

// Remember the visitor once they've entered the password, so they don't have to
// re-enter it each time they open the directory during the beta.
const accessCookieMaxAge = 60 * 60 * 24 * 90; // 90 days

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const nextPath = getSafeNextPath(formData.get("next"));
  // Which page to return to on failure (the directory prompt or the splash).
  const fromPath = getSafeFromPath(formData.get("from"));

  // Throttle guesses so the access password can't be brute-forced.
  if (!rateLimit(`site-access:${clientIp(request)}`, 10, 10 * 60 * 1000)) {
    const url = new URL(fromPath, request.url);
    url.searchParams.set("error", "1");
    url.searchParams.set("next", nextPath);
    return NextResponse.redirect(url, { status: 303 });
  }

  const isValidPassword = await verifySiteAccessPassword(password);

  if (!isValidPassword) {
    const redirectUrl = new URL(fromPath, request.url);
    redirectUrl.searchParams.set("error", "1");
    redirectUrl.searchParams.set("next", nextPath);

    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url), { status: 303 });
  response.cookies.set(SITE_ACCESS_COOKIE, SITE_ACCESS_COOKIE_VALUE, {
    httpOnly: true,
    maxAge: accessCookieMaxAge,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/coming-soon", request.url));
}

function getSafeNextPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

// Only ever redirect back to one of the known password-entry pages.
function getSafeFromPath(value: FormDataEntryValue | null) {
  return value === "/coming-soon" || value === "/directory-access" ? value : "/directory-access";
}
