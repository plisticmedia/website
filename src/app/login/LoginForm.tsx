"use client";

import { FormEvent, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "./LoginPage.module.css";

type Status = "idle" | "submitting" | "sent" | "error";

export function LoginForm({ next }: { next: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const redirectBase =
    typeof window !== "undefined" ? window.location.origin : "";

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
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${redirectBase}/auth/confirm?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
      setStatus("sent");
      setMessage(`Check ${email} for a sign-in link.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not send the link. Please try again.");
    }
  }

  async function handleGoogle() {
    setStatus("submitting");
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${redirectBase}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not start Google sign-in.");
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
      <button
        type="button"
        className={styles.google}
        onClick={handleGoogle}
        disabled={status === "submitting"}
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className={styles.divider}>
        <span>or</span>
      </div>

      <form onSubmit={handleMagicLink} aria-label="Sign in with email">
        <label className={styles.field}>
          <span>Email address</span>
          <div className={styles.inputWrap}>
            <Mail aria-hidden="true" size={18} />
            <input name="email" type="email" autoComplete="email" placeholder="you@studio.com" required />
          </div>
        </label>
        <button className={`p-btn ${styles.submit}`} type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Sending..." : "Email me a sign-in link"}
          <ArrowRight aria-hidden="true" size={18} />
        </button>
      </form>

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
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
