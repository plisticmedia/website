"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ConsolidateButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function run() {
    if (!confirm("Merge duplicate services and locations (e.g. 'Video production' + 'Video Production')? This can't be undone automatically.")) {
      return;
    }
    setBusy(true);
    setMessage("Merging duplicates…");
    try {
      const res = await fetch("/api/admin/consolidate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed.");
      setMessage(`Merged ${data.categories} duplicate service(s) and ${data.locations} duplicate location(s).`);
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: "0.6rem" }}>
      <button type="button" className="p-btn p-btn--ghost" onClick={run} disabled={busy}>
        {busy ? "Merging…" : "Merge duplicate services & locations"}
      </button>
      {message && <p style={{ marginTop: "0.4rem", fontSize: "0.9rem", color: "var(--p-muted)" }}>{message}</p>}
    </div>
  );
}
