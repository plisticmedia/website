"use client";

import { useState } from "react";

/**
 * Runs a data backup on demand and shows the result. The weekly cron does this
 * automatically on Sundays; this button lets an admin take one whenever — e.g.
 * to confirm backups are working, or before a risky change.
 */
export function BackupButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function run() {
    setBusy(true);
    setMessage("Backing up…");
    try {
      const res = await fetch("/api/admin/backup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Backup failed.");
      const kb = data.bytes ? Math.max(1, Math.round(data.bytes / 1024)) : 0;
      setMessage(
        `Backup saved: ${data.filename} — ${data.totalRows} records, ${kb} KB. A summary has been emailed to you. Stored in Supabase → Storage → "plistic-backups".`,
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Backup failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: "0.6rem" }}>
      <button type="button" className="p-btn" onClick={run} disabled={busy}>
        {busy ? "Backing up…" : "Back up data now"}
      </button>
      {message && <p style={{ marginTop: "0.4rem", fontSize: "0.9rem", color: "var(--p-muted)" }}>{message}</p>}
    </div>
  );
}
