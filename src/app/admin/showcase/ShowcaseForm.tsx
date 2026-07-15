"use client";

import { useState } from "react";
import { saveShowcaseItem } from "../actions";
import type { ShowcaseItem } from "@/lib/showcase";
import styles from "./ShowcaseAdmin.module.css";

const KINDS: Array<{ value: string; label: string }> = [
  { value: "news", label: "News" },
  { value: "work", label: "Standout work" },
  { value: "event", label: "Event" },
  { value: "video", label: "Film & video" },
  { value: "image", label: "Image" },
];

/**
 * No-code editor for a showcase story. Full fields + image upload, with a live
 * preview so you can see roughly how it will appear before saving. Used for both
 * new stories and editing existing ones / approving submissions.
 */
export function ShowcaseForm({ item }: { item?: ShowcaseItem }) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [kind, setKind] = useState<string>(item?.kind ?? "news");
  const [summary, setSummary] = useState(item?.summary ?? "");
  const [source, setSource] = useState(item?.source ?? "");
  const [preview, setPreview] = useState<string | null>(item?.image_url ?? null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setPreview(URL.createObjectURL(f));
  }

  return (
    <div className={styles.editor}>
      <form action={saveShowcaseItem.bind(null, item?.id ?? null)} className={styles.form}>
        <label className={styles.field}>
          <span>Type</span>
          <select name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Headline / title *</span>
          <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
        </label>

        <label className={styles.field}>
          <span>Short summary (shown on the card)</span>
          <textarea name="summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} maxLength={400} />
        </label>

        <label className={styles.field}>
          <span>Full story (leave blank for a simple link card)</span>
          <textarea name="body" defaultValue={item?.body ?? ""} rows={8} maxLength={8000} placeholder="Write the story here. Separate paragraphs with a blank line." />
        </label>

        <label className={styles.field}>
          <span>Cover image (upload — JPG/PNG/WebP, max 8 MB)</span>
          <input type="file" name="image" accept="image/*" onChange={onFile} />
        </label>
        <label className={styles.field}>
          <span>…or paste an image URL</span>
          <input name="image_url" defaultValue={item?.image_url ?? ""} placeholder="https://…" onChange={(e) => setPreview(e.target.value || null)} />
        </label>

        <label className={styles.field}>
          <span>Video link (YouTube/Vimeo — only for the &quot;Film &amp; video&quot; type)</span>
          <input name="embed_url" defaultValue={item?.embed_url ?? ""} placeholder="https://youtube.com/…" />
        </label>

        <div className={styles.row2}>
          <label className={styles.field}>
            <span>Credit / source</span>
            <input name="source" value={source} onChange={(e) => setSource(e.target.value)} maxLength={160} placeholder="e.g. Screen Scotland" />
          </label>
          <label className={styles.field}>
            <span>Location</span>
            <input name="location" defaultValue={item?.location ?? ""} maxLength={160} placeholder="e.g. Glasgow" />
          </label>
        </div>

        <div className={styles.row2}>
          <label className={styles.field}>
            <span>Event date (events only)</span>
            <input name="event_date" type="date" defaultValue={item?.event_date ?? ""} />
          </label>
          <label className={styles.field}>
            <span>Source / read-more link (optional)</span>
            <input name="link_url" defaultValue={item?.link_url ?? ""} placeholder="https://…" />
          </label>
        </div>

        <label className={styles.checkline}>
          <input type="checkbox" name="is_featured" defaultChecked={item?.is_featured ?? false} />
          <span>Feature this (shown large / first)</span>
        </label>

        <button type="submit" className="p-btn">{item ? "Save changes & publish" : "Publish to showcase"}</button>
      </form>

      <aside className={styles.previewPane}>
        <p className={styles.previewLabel}>Preview</p>
        <div className={styles.previewCard}>
          {preview ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={preview} alt="" className={styles.previewImg} />
          ) : (
            <div className={styles.previewImgEmpty}>No image yet</div>
          )}
          <div className={styles.previewBody}>
            <span className={styles.previewKind}>{KINDS.find((k) => k.value === kind)?.label ?? kind}</span>
            <h4>{title || "Your headline appears here"}</h4>
            <p>{summary || "Your short summary appears here."}</p>
            {source && <span className={styles.previewSource}>{source}</span>}
          </div>
        </div>
      </aside>
    </div>
  );
}
