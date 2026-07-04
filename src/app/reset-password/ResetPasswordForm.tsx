"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "../login/LoginPage.module.css";

type Status = "checking" | "ready" | "nolink" | "saving" | "done" | "error";

export function ResetPasswordForm() {
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState("");

  // The recovery link lands via /auth/callback, which establishes a session.
  // If there's no session, the link was missing/expired.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setStatus(data.user ? "ready" : "nolink");
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const password = String(fd.get("password") ?? "");
    const confirm = String(fd.get("confirm") ?? "");
    if (password.length < 8) {
      setStatus("error");
      setMessage("Please choose a password of at least 8 characters.");
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
      const msg = error && typeof error === "object" && "message" in error ? String((error as { message: unknown }).message) : "";
      setMessage(msg || "Could not update your password. Please request a new reset link.");
    }
  }

  if (status === "checking") {
    return <p className={styles.status}>Checking your link…</p>;
  }

  if (status === "nolink") {
    return (
      <p className={`${styles.status} ${styles.error}`}>
        <AlertCircle aria-hidden="true" size={18} />
        This reset link is missing or has expired. Please request a new one from the{" "}
        <a href="/login">sign-in page</a> using “Forgot password?”.
      </p>
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
            <input name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} required />
          </div>
        </label>
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
        <p className={`${styles.status} ${styles.error}`} aria-live="polite">
          <AlertCircle aria-hidden="true" size={18} />
          {message}
        </p>
      )}
    </div>
  );
}
