"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import type { Category, Location } from "@/lib/types";
import styles from "./Submit.module.css";

type Status = "idle" | "submitting" | "success" | "error";

export function SubmitListingForm({
  categories,
  locations,
}: {
  categories: Category[];
  locations: Location[];
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("submitting");
    setMessage("");

    try {
      const res = await fetch("/api/submit-listing", { method: "POST", body: new FormData(form) });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong. Please try again.");
      form.reset();
      setStatus("success");
      setMessage("Thanks! Your listing has been submitted and will appear once we've reviewed it.");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className={styles.successCard}>
        <CheckCircle2 aria-hidden="true" size={28} />
        <p>{message}</p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {/* Honeypot */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
        <label>Company<input name="company" type="text" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <label className={styles.field}>
        <span>Business or individual name *</span>
        <input name="title" type="text" required maxLength={160} />
      </label>

      <label className={styles.field}>
        <span>Contact email <em>(not shown publicly — so we can reach you)</em></span>
        <input name="email" type="email" autoComplete="email" maxLength={180} />
      </label>

      <label className={styles.field}>
        <span>Describe what you do *</span>
        <textarea name="description" rows={5} required maxLength={2000} placeholder="A few sentences about your business and services." />
      </label>

      <fieldset className={styles.group}>
        <legend>Which services do you offer? *</legend>
        <div className={styles.checks}>
          {categories.map((c) => (
            <label key={c.id} className={styles.check}>
              <input type="checkbox" name="services" value={c.slug} /> {c.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend>Where do you work? <em>(choose any that apply)</em></legend>
        <div className={styles.checks}>
          {locations.map((l) => (
            <label key={l.id} className={styles.check}>
              <input type="checkbox" name="areas" value={l.slug} /> {l.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.row}>
        <label className={styles.field}>
          <span>Business address <em>(optional — for the map)</em></span>
          <input name="address" type="text" maxLength={300} placeholder="Town or full address" />
        </label>
        <label className={styles.field}>
          <span>Postcode <em>(optional)</em></span>
          <input name="postcode" type="text" maxLength={20} />
        </label>
      </div>

      <label className={styles.field}>
        <span>Logo <em>(optional — PNG or JPG, max 6 MB)</em></span>
        <input name="logo" type="file" accept="image/*" />
      </label>

      <label className={styles.field}>
        <span>Website <em>(optional)</em></span>
        <input name="website" type="url" maxLength={300} placeholder="https://" />
      </label>

      <div className={styles.row}>
        <label className={styles.field}>
          <span>Instagram <em>(optional)</em></span>
          <input name="instagram" type="url" maxLength={300} placeholder="https://instagram.com/…" />
        </label>
        <label className={styles.field}>
          <span>LinkedIn <em>(optional)</em></span>
          <input name="linkedin" type="url" maxLength={300} placeholder="https://linkedin.com/…" />
        </label>
      </div>
      <div className={styles.row}>
        <label className={styles.field}>
          <span>Facebook <em>(optional)</em></span>
          <input name="facebook" type="url" maxLength={300} placeholder="https://facebook.com/…" />
        </label>
        <label className={styles.field}>
          <span>Google listing <em>(optional — for reviews)</em></span>
          <input name="other" type="url" maxLength={300} placeholder="Your Google Business link" />
        </label>
      </div>

      {status === "error" && (
        <p className={`${styles.status} ${styles.error}`} aria-live="polite">
          <AlertCircle aria-hidden="true" size={18} /> {message}
        </p>
      )}

      <button className={`p-btn ${styles.submit}`} type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Submitting…" : "Submit for review"}
        <ArrowRight aria-hidden="true" size={18} />
      </button>
      <p className={styles.note}>Listings are reviewed before they appear. It&apos;s free to be listed.</p>
    </form>
  );
}
