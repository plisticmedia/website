"use client";

import { FormEvent, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Lock, Mail } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "./LoginPage.module.css";

type Status = "idle" | "submitting" | "sent" | "error";
type Mode = "password" | "magic";

function readError(error: unknown, fallback: string): string {
  const msg =
    error && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string"
      ? (error as { message: string }).message
      : "";
  if (/rate limit/i.test(msg)) {
    return "Too many attempts for now. Please wait a little while and try again.";
  }
  if (/invalid login credentials/i.test(msg)) {
    return "That email and password don't match. Check them, or use “Forgot password?”.";
  }
  return msg || fallback;
}

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<Mode>("password");
  const [signUp, setSignUp] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const redirectBase = typeof window !== "undefined" ? window.location.origin : "";
  const callbackUrl = `${redirectBase}/auth/callback?next=${encodeURIComponent(next)}`;

  async function handlePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    if (!email || !password) return;
    setStatus("submitting");
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      if (signUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: callbackUrl },
        });
        if (error) throw error;
        if (data.session) {
          window.location.href = next; // confirmation off — straight in
          return;
        }
        setStatus("sent");
        setMessage(`Almost there — check ${email} to confirm your account, then sign in.`);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = next;
      }
    } catch (error) {
      setStatus("error");
      setMessage(readError(error, "Could not sign you in. Please try again."));
    }
  }

  async function handleMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    if (!email) return;
    setStatus("submitting");
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true, emailRedirectTo: callbackUrl },
      });
      if (error) throw error;
      setStatus("sent");
      setMessage(`Check ${email} for a sign-in link. It expires in an hour — open it on this device.`);
    } catch (error) {
      setStatus("error");
      setMessage(readError(error, "Could not send the link. Please try again."));
    }
  }

  async function handleForgot(email: string) {
    if (!email) {
      setStatus("error");
      setMessage("Enter your email above first, then tap “Forgot password?”.");
      return;
    }
    setStatus("submitting");
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${redirectBase}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
      });
      if (error) throw error;
      setStatus("sent");
      setMessage(`Check ${email} for a link to set a new password.`);
    } catch (error) {
      setStatus("error");
      setMessage(readError(error, "Could not send the reset email. Please try again."));
    }
  }

  async function handleGoogle() {
    setStatus("submitting");
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl },
      });
      if (error) throw error;
    } catch (error) {
      setStatus("error");
      setMessage(readError(error, "Could not start Google sign-in."));
    }
  }

  if (status === "sent") {
    return (
      <p className={`${styles.status} ${styles.success}`} aria-live="polite">
        <CheckCircle2 aria-hidden="true" size={18} />
        {message}
      </p>
    );
  }

  return (
    <div className={styles.card}>
      <button type="button" className={styles.google} onClick={handleGoogle} disabled={status === "submitting"}>
        <GoogleIcon />
        Continue with Google
      </button>

      <div className={styles.divider}><span>or</span></div>

      {mode === "password" ? (
        <form onSubmit={handlePassword} aria-label="Sign in with a password">
          <label className={styles.field}>
            <span>Email address</span>
            <div className={styles.inputWrap}>
              <Mail aria-hidden="true" size={18} />
              <input name="email" type="email" autoComplete="email" placeholder="you@studio.com" required />
            </div>
          </label>
          <label className={styles.field}>
            <span>Password</span>
            <div className={styles.inputWrap}>
              <Lock aria-hidden="true" size={18} />
              <input
                name="password"
                type="password"
                autoComplete={signUp ? "new-password" : "current-password"}
                placeholder={signUp ? "Choose a password (min 8 characters)" : "Your password"}
                minLength={8}
                required
              />
            </div>
          </label>
          <button className={`p-btn ${styles.submit}`} type="submit" disabled={status === "submitting"}>
            {status === "submitting" ? "Please wait…" : signUp ? "Create account" : "Sign in"}
            <ArrowRight aria-hidden="true" size={18} />
          </button>

          <div className={styles.altRow}>
            <button type="button" className={styles.linkBtn} onClick={() => { setSignUp((v) => !v); setStatus("idle"); setMessage(""); }}>
              {signUp ? "Have an account? Sign in" : "New here? Create an account"}
            </button>
            {!signUp && (
              <button
                type="button"
                className={styles.linkBtn}
                onClick={(e) => {
                  const form = (e.currentTarget.closest("form") as HTMLFormElement | null);
                  const email = String(new FormData(form ?? undefined).get("email") ?? "").trim();
                  handleForgot(email);
                }}
              >
                Forgot password?
              </button>
            )}
          </div>
        </form>
      ) : (
        <form onSubmit={handleMagicLink} aria-label="Sign in with an email link">
          <label className={styles.field}>
            <span>Email address</span>
            <div className={styles.inputWrap}>
              <Mail aria-hidden="true" size={18} />
              <input name="email" type="email" autoComplete="email" placeholder="you@studio.com" required />
            </div>
          </label>
          <button className={`p-btn ${styles.submit}`} type="submit" disabled={status === "submitting"}>
            {status === "submitting" ? "Sending…" : "Email me a sign-in link"}
            <ArrowRight aria-hidden="true" size={18} />
          </button>
        </form>
      )}

      <button
        type="button"
        className={styles.switchMode}
        onClick={() => { setMode((m) => (m === "password" ? "magic" : "password")); setStatus("idle"); setMessage(""); }}
      >
        {mode === "password" ? "Prefer an email link instead?" : "Use a password instead"}
      </button>

      {status === "error" && (
        <p className={`${styles.status} ${styles.error}`} aria-live="polite">
          <AlertCircle aria-hidden="true" size={18} />
          {message}
        </p>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  );
}
