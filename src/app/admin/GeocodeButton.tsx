"use client";

import { useState } from "react";

export function GeocodeButton({ remaining }: { remaining: number }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function run() {
    setBusy(true);
    setMessage("Locating listings…");
    try {
      const res = await fetch("/api/admin/geocode", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed.");
      const failed = data.failed
        ? ` ${data.failed} couldn't be located (${(data.failedNames ?? []).slice(0, 3).join(", ")}) — add an address/postcode to those listings.`
        : "";
      setMessage(`Placed ${data.updated} on the map.${failed} ${data.remaining} still to do.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: "0.6rem" }}>
      <button type="button" className="p-btn p-btn--ghost" onClick={run} disabled={busy}>
        {busy ? "Locating…" : `Add listings to the map (${remaining} to place)`}
      </button>
      {message && <p style={{ marginTop: "0.4rem", fontSize: "0.9rem", color: "var(--p-muted)" }}>{message}</p>}
    </div>
  );
}
