"use client";

import { FormEvent, useEffect, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { AlertCircle, CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { PASSWORD_HINT, passwordError } from "@/lib/password";
import styles from "../login/LoginPage.module.css";

type Status = "checking" | "needs2fa" | "ready" | "nolink" | "saving" | "done" | "error";

export function ResetPasswordForm() {
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState("");
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");

  // Complete the recovery link in the browser, then — if the account has 2FA —
  // step up to it before allowing the password change (Supabase requires it).
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const tokenHash = url.searchParams.get("token_hash");
    const type = url.searchParams.get("type") as EmailOtpType | null;

    (async () => {
      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
          if (error) throw error;
        }
      } catch {
        /* may already be consumed; fall through to the session check */
      }
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setStatus("nolink");
        return;
      }
      if (code || tokenHash) window.history.replaceState({}, "", "/reset-password");

      // If MFA is enabled on this account, a password change needs AAL2.
      try {
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal && aal.currentLevel !== "aal2" && aal.nextLevel === "aal2") {
          const { data: factors } = await supabase.auth.mfa.listFactors();
          const factor = (factors?.totp ?? []).find((f) => f.status === "verified");
          if (factor) {
            setFactorId(factor.id);
            setStatus("needs2fa");
            return;
          }
        }
      } catch {
        /* no MFA / not available — proceed */
      }
      setStatus("ready");
    })();
  }, []);

  async function verify2fa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = code.replace(/\s/g, "");
    if (clean.length !== 6) {
      setMessage("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setStatus("saving");
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
      if (cErr) throw cErr;
      const { error: vErr } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: clean });
      if (vErr) throw vErr;
      setStatus("ready");
      setCode("");
    } catch (error) {
      setStatus("needs2fa");
      setMessage(readMsg(error, "That code didn't match. Check your app and try again."));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const password = String(fd.get("password") ?? "");
    const confirm = String(fd.get("confirm") ?? "");
    const pwErr = passwordError(password);
    if (pwErr) {
      setStatus("error");
      setMessage(pwErr);
      return;
    }
    if (password !== confirm) {
      setStatus("error");
      setMessage("The two passwords don't match.");
      return;
    }
    setStatus("saving");
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStatus("done");
      setMessage("Password updated. Taking you to your dashboard…");
      setTimeout(() => { window.location.href = "/dashboard"; }, 1200);
    } catch (error) {
      setStatus("error");
      setMessage(readMsg(error, "Could not update your password. Please request a new reset link."));
    }
  }

  if (status === "checking") {
    return <p className={styles.status}>Checking your link…</p>;
  }

  if (status === "nolink") {
    return (
      <div className={styles.card}>
        <p className={`${styles.status} ${styles.error}`} style={{ alignItems: "flex-start" }}>
          <AlertCircle aria-hidden="true" size={18} style={{ flex: "none", marginTop: "2px" }} />
          <span>
            This reset link has expired or has already been used. For security, each link works only once and times
            out — just request a fresh one.
          </span>
        </p>
        <a href="/login" className={`p-btn ${styles.submit}`} style={{ marginTop: "1rem", justifyContent: "center" }}>
          Request a new reset link
        </a>
      </div>
    );
  }

  if (status === "needs2fa") {
    return (
      <div className={styles.card}>
        <p className={styles.status} style={{ alignItems: "flex-start", marginBottom: "0.8rem" }}>
          <ShieldCheck aria-hidden="true" size={18} style={{ flex: "none", marginTop: "2px" }} />
          <span>Enter the 6-digit code from your authenticator app to confirm it&apos;s you.</span>
        </p>
        <form onSubmit={verify2fa} aria-label="Confirm your two-factor code">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            maxLength={7}
            autoFocus
            style={{ fontSize: "1.4rem", letterSpacing: "0.3em", padding: "0.5rem 0.7rem", width: "8ch", border: "1px solid var(--p-line)", borderRadius: "10px" }}
          />
          <button className={`p-btn ${styles.submit}`} type="submit" style={{ marginTop: "0.9rem" }}>
            Confirm &amp; continue
          </button>
        </form>
        {message && (
          <p className={`${styles.status} ${styles.error}`} aria-live="polite" style={{ alignItems: "flex-start" }}>
            <AlertCircle aria-hidden="true" size={18} style={{ flex: "none", marginTop: "2px" }} />
            <span>{message}</span>
          </p>
        )}
      </div>
    );
  }

  if (status === "done") {
    return (
      <p className={`${styles.status} ${styles.success}`} aria-live="polite">
        <CheckCircle2 aria-hidden="true" size={18} />
        {message}
      </p>
    );
  }

  return (
    <div className={styles.card}>
      <form onSubmit={handleSubmit} aria-label="Set a new password">
        <label className={styles.field}>
          <span>New password</span>
          <div className={styles.inputWrap}>
            <Lock aria-hidden="true" size={18} />
            <input name="password" type="password" autoComplete="new-password" placeholder="Your new password" minLength={8} required />
          </div>
        </label>
        <p style={{ margin: "-0.3rem 0 0.4rem", fontSize: "0.82rem", color: "var(--p-muted)", lineHeight: 1.4 }}>{PASSWORD_HINT}</p>
        <label className={styles.field}>
          <span>Confirm new password</span>
          <div className={styles.inputWrap}>
            <Lock aria-hidden="true" size={18} />
            <input name="confirm" type="password" autoComplete="new-password" placeholder="Re-enter your password" minLength={8} required />
          </div>
        </label>
        <button className={`p-btn ${styles.submit}`} type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : "Set new password"}
        </button>
      </form>
      {status === "error" && (
        <p className={`${styles.status} ${styles.error}`} aria-live="polite" style={{ alignItems: "flex-start" }}>
          <AlertCircle aria-hidden="true" size={18} style={{ flex: "none", marginTop: "2px" }} />
          <span>{message}</span>
        </p>
      )}
    </div>
  );
}

function readMsg(error: unknown, fallback: string): string {
  const msg = error && typeof error === "object" && "message" in error ? String((error as { message: unknown }).message) : "";
  return msg || fallback;
}
