"use client";

import { FormEvent, useRef, useState } from "react";
import styles from "../Admin.module.css";

type Status = "idle" | "working" | "done" | "error";

type SkippedRow = { row: number; name: string; reason: string };
type Result = {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  skippedRows: SkippedRow[];
  headers: string[];
  delimiter: string;
  dataRows: number;
  usedNameFallback: boolean;
  dryRun: boolean;
};

export function ImportForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function run(preview: boolean) {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    fd.set("preview", preview ? "on" : "off");
    if (!(fd.get("file") instanceof File) || (fd.get("file") as File).size === 0) {
      setStatus("error");
      setMessage("Please choose a CSV file first.");
      return;
    }
    setStatus("working");
    setResult(null);
    setMessage(preview ? "Previewing…" : "Importing… this can take a minute for large files.");
    try {
      const res = await fetch("/api/admin/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Import failed.");
      setResult(data as Result);
      setStatus("done");
      const verb = data.dryRun ? "Would import" : "Imported";
      setMessage(
        `${verb}: ${data.created} new, ${data.updated} updated, ${data.skipped} skipped — from ${data.dataRows} data row(s), read as ${data.delimiter}-separated.`,
      );
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Import failed.");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    run(false);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 640 }}>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <span style={{ fontWeight: 600 }}>CSV file</span>
        <input type="file" name="file" accept=".csv,text/csv,text/plain" required />
      </label>
      <p style={{ fontSize: "0.85rem", color: "var(--p-muted)", margin: 0 }}>
        The first row must be column headers. The business name can be in a column called Name, Business, Company,
        Organisation, Studio (and similar) — or, if none of those match, the first column is used. Comma, semicolon,
        and tab-separated files are all handled.
      </p>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <span style={{ fontWeight: 600 }}>Source <em style={{ fontWeight: 400, color: "var(--p-muted)" }}>(optional — e.g. &ldquo;public research&rdquo; for seeded businesses)</em></span>
        <input type="text" name="source" placeholder="public research" maxLength={80} style={{ padding: "0.6rem 0.8rem", border: "1px solid var(--p-line)", borderRadius: 10 }} />
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <input type="checkbox" name="publish" />
        Publish immediately (otherwise imported as &ldquo;in review&rdquo;)
      </label>

      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <button type="button" className="p-btn p-btn--ghost" disabled={status === "working"} onClick={() => run(true)}>
          {status === "working" ? "Working…" : "Preview (don’t save)"}
        </button>
        <button type="submit" className="p-btn" disabled={status === "working"}>
          {status === "working" ? "Importing…" : "Import listings"}
        </button>
      </div>

      {message && (
        <p style={{ color: status === "error" ? "var(--p-coral, #f06d45)" : "var(--p-ink)", fontSize: "0.92rem", fontWeight: 600 }} aria-live="polite">
          {message}
        </p>
      )}

      {result && (
        <div style={{ border: "1px solid var(--p-line)", borderRadius: 12, padding: "0.9rem 1rem", fontSize: "0.88rem", display: "flex", flexDirection: "column", gap: "0.7rem" }}>
          {result.headers.length > 0 && (
            <div>
              <strong>Columns detected:</strong> {result.headers.join(" · ")}
            </div>
          )}
          {result.usedNameFallback && (
            <div style={{ color: "var(--p-coral, #f06d45)" }}>
              ⚠ No standard business-name column was found, so the <strong>first column</strong> was used as the name.
              If that’s wrong, rename your name column to “Business name” and re-run.
            </div>
          )}
          {result.skippedRows.length > 0 && (
            <div>
              <strong>Skipped rows ({result.skippedRows.length}):</strong>
              <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.1rem", maxHeight: 220, overflowY: "auto" }}>
                {result.skippedRows.slice(0, 60).map((s, i) => (
                  <li key={i}>Row {s.row}{s.name ? ` (${s.name})` : ""}: {s.reason}</li>
                ))}
                {result.skippedRows.length > 60 && <li>… and {result.skippedRows.length - 60} more.</li>}
              </ul>
            </div>
          )}
          {result.errors.length > 0 && (
            <div style={{ color: "var(--p-coral, #f06d45)" }}>
              <strong>Errors ({result.errors.length}):</strong>
              <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.1rem", maxHeight: 160, overflowY: "auto" }}>
                {result.errors.slice(0, 40).map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
          {!result.dryRun && (result.created > 0 || result.updated > 0) && (
            <div style={{ color: "var(--p-azure-deep)" }}>
              Next: run <strong>Geocode missing</strong> to place them on the map, and <strong>Import Google Drive logos into storage</strong> so logos display.
            </div>
          )}
        </div>
      )}
    </form>
  );
}
