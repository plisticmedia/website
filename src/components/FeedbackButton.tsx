"use client";

import { FormEvent, useState } from "react";
import { track } from "@vercel/analytics";
import { MessageSquarePlus, X } from "lucide-react";

/**
 * Beta-only floating feedback button. Lets testers fire off a quick note from
 * any page without leaving the site; it emails the team. Rendered only while
 * the site is in coming-soon (beta) mode.
 */
export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
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
          email: String(fd.get("email") ?? ""),
          page: typeof window !== "undefined" ? window.location.pathname : "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Could not send.");
      track("feedback_sent");
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Could not send.");
    }
  }

  return (
    <>
      <button
        type="button"
        className="feedback-fab"
        onClick={() => {
          setOpen(true);
          setStatus("idle");
        }}
        aria-label="Give feedback"
      >
        <MessageSquarePlus aria-hidden="true" size={18} />
        <span>Feedback</span>
      </button>

      {open && (
        <div className="feedback-modal" role="dialog" aria-modal="true" aria-label="Send feedback">
          <button type="button" className="feedback-backdrop" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="feedback-panel">
            <div className="feedback-head">
              <strong>Share your feedback</strong>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)}>
                <X aria-hidden="true" size={18} />
              </button>
            </div>

            {status === "done" ? (
              <div className="feedback-done">
                <p>Thank you — that's genuinely helpful. 🙏</p>
                <button type="button" className="p-btn" onClick={() => setOpen(false)}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="feedback-form">
                <label>
                  <span>What did you notice? Anything confusing, broken, or missing — be honest.</span>
                  <textarea name="message" rows={4} required placeholder="Type your thoughts…" autoFocus />
                </label>
                <label>
                  <span>Your email (optional — only if you're happy for us to follow up)</span>
                  <input name="email" type="email" placeholder="you@example.com" />
                </label>
                {status === "error" && <p className="feedback-error">{error}</p>}
                <button type="submit" className="p-btn" disabled={status === "sending"}>
                  {status === "sending" ? "Sending…" : "Send feedback"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
