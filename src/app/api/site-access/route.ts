import { NextRequest, NextResponse } from "next/server";
import { SITE_ACCESS_COOKIE, SITE_ACCESS_COOKIE_VALUE, verifySiteAccessPassword } from "@/lib/siteAccess";
import { rateLimit, clientIp } from "@/lib/rateLimit";

const thirtyDays = 60 * 60 * 24 * 30;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const nextPath = getSafeNextPath(formData.get("next"));

  // Throttle guesses so the coming-soon password can't be brute-forced.
  if (!rateLimit(`site-access:${clientIp(request)}`, 10, 10 * 60 * 1000)) {
    const url = new URL("/coming-soon", request.url);
    url.searchParams.set("error", "1");
    url.searchParams.set("next", nextPath);
    return NextResponse.redirect(url, { status: 303 });
  }

  const isValidPassword = await verifySiteAccessPassword(password);

  if (!isValidPassword) {
    const redirectUrl = new URL("/coming-soon", request.url);
    redirectUrl.searchParams.set("error", "1");
    redirectUrl.searchParams.set("next", nextPath);

    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url), { status: 303 });
  response.cookies.set(SITE_ACCESS_COOKIE, SITE_ACCESS_COOKIE_VALUE, {
    httpOnly: true,
    maxAge: thirtyDays,
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
