"use client";

import { FormEvent, useState } from "react";
import { track } from "@vercel/analytics";
import { Star, Send, CheckCircle2 } from "lucide-react";
import styles from "./Feedback.module.css";

export function FeedbackForm() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const message = String(fd.get("message") ?? "").trim();
    if (!message) return;
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          rating: rating || undefined,
          page: "/feedback",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Could not send. Please try again.");
      track("feedback_sent");
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Could not send. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <div className={styles.doneCard}>
        <CheckCircle2 aria-hidden="true" size={30} />
        <h2>Thank you — that&apos;s genuinely helpful. 🙏</h2>
        <p>Your feedback has gone straight to the team. It shapes what we build next.</p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.ratingRow}>
        <span className={styles.ratingLabel}>How&apos;s your experience so far?</span>
        <div className={styles.stars} role="radiogroup" aria-label="Rating out of 5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={styles.starBtn}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              aria-pressed={rating === n}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
            >
              <Star size={30} fill={(hover || rating) >= n ? "currentColor" : "none"} strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </div>

      <label className={styles.field}>
        <span>What did you notice? Anything confusing, broken, or missing — be honest. *</span>
        <textarea name="message" rows={6} required placeholder="Tell us what worked, what didn't, and anything you'd love to see…" />
      </label>

      <div className={styles.row}>
        <label className={styles.field}>
          <span>Your name <em>(optional)</em></span>
          <input name="name" type="text" autoComplete="name" maxLength={120} />
        </label>
        <label className={styles.field}>
          <span>Your email <em>(optional — only if you&apos;re happy for us to follow up)</em></span>
          <input name="email" type="email" autoComplete="email" maxLength={180} placeholder="you@example.com" />
        </label>
      </div>

      {status === "error" && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.submit} disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send feedback"}
        <Send aria-hidden="true" size={17} />
      </button>
    </form>
  );
}
