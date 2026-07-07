"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * One-click publish for imported (unclaimed) listings still in review. Shows a
 * confirm first, since it makes them public (once the coming-soon gate is off).
 */
export function PublishImportedButton({ count }: { count: number }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function run() {
    if (!window.confirm(`Publish all ${count} imported listing(s) that are still in review? You can unpublish any of them later.`)) {
      return;
    }
    setBusy(true);
    setMessage("Publishing…");
    try {
      const res = await fetch("/api/admin/publish-imported", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed.");
      setMessage(`Published ${data.published} listing(s). They'll appear in the directory (once the coming-soon gate is off).`);
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  if (count <= 0) return null;

  return (
    <div style={{ marginTop: "0.6rem" }}>
      <button type="button" className="p-btn" onClick={run} disabled={busy}>
        {busy ? "Publishing…" : `Publish all imported listings (${count} in review)`}
      </button>
      {message && <p style={{ marginTop: "0.4rem", fontSize: "0.9rem", color: "var(--p-muted)" }}>{message}</p>}
    </div>
  );
}
