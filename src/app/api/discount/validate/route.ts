import { NextResponse } from "next/server";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { validateDiscountCode } from "@/lib/discountsServer";

export const runtime = "nodejs";

/**
 * Checks a discount code entered in the pricing estimator. Public, but rate
 * limited so it can't be used to brute-force codes. Returns only the fields the
 * estimator needs to show the discount.
 */
export async function POST(request: Request) {
  if (!rateLimit(`discount:${clientIp(request)}`, 20, 10 * 60 * 1000)) {
    return NextResponse.json({ valid: false, error: "Too many attempts — please try again shortly." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ valid: false, error: "Please enter a code." }, { status: 400 });
  }

  const code = typeof (body as { code?: unknown })?.code === "string" ? (body as { code: string }).code : "";
  const service = typeof (body as { service?: unknown })?.service === "string" ? (body as { service: string }).service : "all";

  const result = await validateDiscountCode(code, service);
  if (!result.valid) {
    return NextResponse.json({ valid: false, error: result.reason });
  }

  return NextResponse.json({ valid: true, ...result.info });
}
