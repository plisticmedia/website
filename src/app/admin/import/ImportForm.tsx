"use client";

import { FormEvent, useState } from "react";
import styles from "../Admin.module.css";

type Status = "idle" | "working" | "done" | "error";

export function ImportForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("working");
    setMessage("Importing… this can take a minute for large files.");
    try {
      const res = await fetch("/api/admin/import", { method: "POST", body: new FormData(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Import failed.");
      setStatus("done");
      const errs = data.errors?.length ? ` (${data.errors.length} rows had errors)` : "";
      setMessage(`Done — created ${data.created}, updated ${data.updated ?? 0}, skipped ${data.skipped}${errs}. New listings are ${form.publish?.checked ? "published" : "in review"}.`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Import failed.");
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 520 }}>
      <label className={styles.inlineInput} style={{ display: "flex", flexDirection: "column", gap: "0.4rem", border: "none", padding: 0 }}>
        <span style={{ fontWeight: 600 }}>CSV file</span>
        <input type="file" name="file" accept=".csv,text/csv" required />
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <input type="checkbox" name="publish" />
        Publish immediately (otherwise imported as “in review”)
      </label>
      <button type="submit" className="p-btn" disabled={status === "working"}>
        {status === "working" ? "Importing…" : "Import listings"}
      </button>
      {message && (
        <p style={{ color: status === "error" ? "var(--p-coral, #f06d45)" : "var(--p-ink)", fontSize: "0.92rem" }} aria-live="polite">
          {message}
        </p>
      )}
    </form>
  );
}
