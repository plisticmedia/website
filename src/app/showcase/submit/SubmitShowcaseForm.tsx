"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import styles from "../Showcase.module.css";
import form from "./Submit.module.css";

export function SubmitShowcaseForm() {
  const [kind, setKind] = useState("work");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    try {
      const res = await fetch("/api/showcase-submit", { method: "POST", body: new FormData(event.currentTarget) });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      setStatus("success");
      setMessage("Thank you — your submission is in. We'll review it and add the best of what comes in.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <p className={form.success}>
        <CheckCircle2 aria-hidden="true" size={20} /> {message}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={form.form}>
      {/* Honeypot */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className={form.hp} aria-hidden="true" />

      <label className={form.field}>
        <span>What is it?</span>
        <select name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="work">A piece of work</option>
          <option value="video">A film / video</option>
          <option value="event">An event</option>
          <option value="news">A story / news</option>
          <option value="image">An image</option>
        </select>
      </label>

      <label className={form.field}>
        <span>Title *</span>
        <input name="title" type="text" required maxLength={160} placeholder="What should we call it?" />
      </label>

      <label className={form.field}>
        <span>Tell us about it</span>
        <textarea name="summary" rows={3} maxLength={600} placeholder="A sentence or two on why it's worth celebrating." />
      </label>

      {kind === "video" && (
        <label className={form.field}>
          <span>YouTube or Vimeo link</span>
          <input name="embed_url" type="text" maxLength={400} placeholder="https://youtube.com/watch?v=…" />
        </label>
      )}

      <label className={form.field}>
        <span>Link {kind === "news" ? "to the story" : "(website, article, portfolio)"}</span>
        <input name="link_url" type="text" maxLength={400} placeholder="yoursite.com/…" />
      </label>

      <div className={form.row}>
        <label className={form.field}>
          <span>Who made it / source</span>
          <input name="source" type="text" maxLength={160} placeholder="Studio, artist or organisation" />
        </label>
        <label className={form.field}>
          <span>Location</span>
          <input name="location" type="text" maxLength={120} placeholder="e.g. Glasgow" />
        </label>
      </div>

      <label className={form.field}>
        <span>Your email (so we can credit / contact you)</span>
        <input name="email" type="email" maxLength={180} placeholder="you@example.com" />
      </label>

      <button type="submit" className="p-btn" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Submit to the showcase"}
      </button>

      {status === "error" && <p className={`${styles.empty} ${form.error}`}>{message}</p>}
    </form>
  );
}
