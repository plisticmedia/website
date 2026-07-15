"use client";

import { FormEvent, useState } from "react";
import { track } from "@vercel/analytics";
import { Mail, CheckCircle2 } from "lucide-react";
import styles from "./NewsletterSignup.module.css";

/**
 * Email signup with granular, GDPR-friendly consent: two independent opt-ins,
 * both unticked by default. Posts to /api/subscribe.
 */
export function NewsletterSignup({ source = "site" }: { source?: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const notify_stories = fd.get("notify_stories") === "on";
    const marketing = fd.get("marketing") === "on";
    if (!notify_stories && !marketing) {
      setStatus("error");
      setMessage("Please tick at least one box so we know what to send you.");
      return;
    }
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, notify_stories, marketing, source }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Could not sign you up.");
      track("newsletter_signup", { source });
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Could not sign you up.");
    }
  }

  if (status === "done") {
    return (
      <div className={styles.wrap}>
        <p className={styles.done}>
          <CheckCircle2 aria-hidden="true" size={20} /> You&apos;re on the list — check your inbox for a confirmation.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <Mail aria-hidden="true" size={22} className={styles.headIcon} />
        <div>
          <h3 className={styles.title}>Stay in the loop</h3>
          <p className={styles.sub}>
            New stories from Scotland&apos;s media and creative scene — for anyone keeping an eye on the sector.
          </p>
        </div>
      </div>
      <form onSubmit={submit} className={styles.form}>
        <div className={styles.row}>
          <input
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            aria-label="Email address"
            className={styles.input}
          />
          <button type="submit" className="p-btn" disabled={status === "sending"}>
            {status === "sending" ? "Signing up…" : "Sign up"}
          </button>
        </div>
        <div className={styles.consents}>
          <label className={styles.check}>
            <input type="checkbox" name="notify_stories" defaultChecked />
            <span>Tell me when new stories are published</span>
          </label>
          <label className={styles.check}>
            <input type="checkbox" name="marketing" />
            <span>Send me the Plistic newsletter &amp; occasional updates</span>
          </label>
        </div>
        <p className={styles.legal}>
          We&apos;ll only send what you tick, and you can unsubscribe any time. See our{" "}
          <a href="/privacy">privacy policy</a>.
        </p>
        {status === "error" && <p className={styles.error}>{message}</p>}
      </form>
    </div>
  );
}
