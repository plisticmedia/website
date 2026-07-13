import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Unified auth landing route for OAuth (Google) and email magic links.
 * Handles BOTH styles so no Supabase email-template edit is required:
 *   - `?code=...`        -> exchangeCodeForSession (PKCE / OAuth)
 *   - `?token_hash&type` -> verifyOtp (magic link / OTP)
 * Then redirects to the originally requested page (`next`).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(url.searchParams.get("next"));

  const supabase = await createSupabaseServerClient();

  // Password recovery must be completed in the browser — the PKCE verifier and
  // session live there, not on the server. Forward the tokens to the reset page
  // and let it finish, instead of failing the server-side exchange.
  if (type === "recovery" || next === "/reset-password") {
    const rp = new URL("/reset-password", url.origin);
    if (code) rp.searchParams.set("code", code);
    if (tokenHash) rp.searchParams.set("token_hash", tokenHash);
    if (type) rp.searchParams.set("type", type);
    return NextResponse.redirect(rp);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }

  // Fallback: if Supabase already established the session (e.g. it set cookies
  // during its own verify step), just proceed.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return NextResponse.redirect(new URL(next, url.origin));

  return NextResponse.redirect(new URL("/login?error=auth", url.origin));
}

/** Only allow same-site relative redirects. */
function safeNext(value: string | null) {
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/dashboard";
}
