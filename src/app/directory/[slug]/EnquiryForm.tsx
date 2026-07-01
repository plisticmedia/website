"use client";

import { FormEvent, useState } from "react";
import { AlertCircle, CheckCircle2, Send } from "lucide-react";
import styles from "./Listing.module.css";

type Status = "idle" | "submitting" | "success" | "error";

export function EnquiryForm({ serviceId, serviceTitle }: { serviceId: string; serviceTitle: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    setStatus("submitting");
    setMessage("");

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, serviceId }),
      });
      const result = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(result?.error ?? "Could not send your enquiry. Please try again.");
      form.reset();
      setStatus("success");
      setMessage("Your enquiry has been sent. The seller will reply to you by email.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <p className={`${styles.formStatus} ${styles.statusOk}`} aria-live="polite">
        <CheckCircle2 aria-hidden="true" size={18} />
        {message}
      </p>
    );
  }

  return (
    <form className={styles.enquiryForm} onSubmit={handleSubmit} aria-label={`Enquire about ${serviceTitle}`}>
      {/* Honeypot — bots fill this; humans never see it. */}
      <div aria-hidden="true" className={styles.honeypot}>
        <label>
          Company
          <input name="company" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className={styles.field}>
        <span>Your name</span>
        <input name="name" type="text" autoComplete="name" required maxLength={120} />
      </label>
      <label className={styles.field}>
        <span>Your email</span>
        <input name="email" type="email" autoComplete="email" required maxLength={180} />
      </label>
      <label className={styles.field}>
        <span>Message</span>
        <textarea name="message" rows={4} required maxLength={2000} placeholder="Tell them about your project…" />
      </label>

      {status === "error" && (
        <p className={`${styles.formStatus} ${styles.statusErr}`} aria-live="polite">
          <AlertCircle aria-hidden="true" size={18} />
          {message}
        </p>
      )}

      <button type="submit" className={`p-btn ${styles.enquireBtn}`} disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Send enquiry"}
        <Send aria-hidden="true" size={16} />
      </button>
    </form>
  );
}
