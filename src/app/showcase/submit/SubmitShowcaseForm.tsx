"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import styles from "../Showcase.module.css";
import form from "./Submit.module.css";

const KIND_LABEL: Record<string, string> = {
  work: "Work", video: "Film", event: "Event", news: "News", image: "Image",
};

export function SubmitShowcaseForm() {
  const [kind, setKind] = useState("work");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [source, setSource] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    try {
      const res = await fetch("/api/showcase-submit", { method: "POST", body: new FormData(event.currentTarget) });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      setStatus("success");
      setMessage("Thank you — your submission is in. We review everything and feature the best.");
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
    <div className={form.layout}>
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
          <input name="title" type="text" required maxLength={200} placeholder="What should we call it?" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>

        <label className={form.field}>
          <span>Short summary (shown on the card)</span>
          <textarea name="summary" rows={2} maxLength={400} placeholder="A sentence or two on why it's worth celebrating." value={summary} onChange={(e) => setSummary(e.target.value)} />
        </label>

        <label className={form.field}>
          <span>The full story (optional — write it however you&apos;d like it to read)</span>
          <textarea name="body" rows={7} maxLength={8000} placeholder="Tell the whole story here. Separate paragraphs with a blank line. Leave blank if you just want a short card with a link." />
        </label>

        <label className={form.field}>
          <span>Add an image (JPG/PNG/WebP, max 8 MB)</span>
          <input type="file" name="image" accept="image/*" onChange={onFile} />
        </label>

        {kind === "video" && (
          <label className={form.field}>
            <span>YouTube or Vimeo link</span>
            <input name="embed_url" type="text" maxLength={400} placeholder="https://youtube.com/watch?v=…" />
          </label>
        )}

        <label className={form.field}>
          <span>Link {kind === "news" ? "to the source" : "(website, article, portfolio)"} — optional</span>
          <input name="link_url" type="text" maxLength={400} placeholder="yoursite.com/…" />
        </label>

        <div className={form.row}>
          <label className={form.field}>
            <span>Who made it / source</span>
            <input name="source" type="text" maxLength={160} placeholder="Studio, artist or organisation" value={source} onChange={(e) => setSource(e.target.value)} />
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

      <aside className={form.previewPane}>
        <p className={form.previewLabel}>How it&apos;ll look</p>
        <div className={form.previewCard}>
          {preview ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={preview} alt="" className={form.previewImg} />
          ) : (
            <div className={form.previewImgEmpty}>Your image appears here</div>
          )}
          <div className={form.previewBody}>
            <span className={form.previewKind}>{KIND_LABEL[kind] ?? kind}</span>
            <h4>{title || "Your title appears here"}</h4>
            <p>{summary || "Your summary appears here."}</p>
            {source && <span className={form.previewSource}>{source}</span>}
          </div>
        </div>
        <p className={form.previewNote}>
          We review every submission before it goes live, so you don&apos;t need to get it perfect.
        </p>
      </aside>
    </div>
  );
}
