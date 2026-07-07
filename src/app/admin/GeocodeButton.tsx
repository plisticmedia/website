"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GeocodeButton({ remaining }: { remaining: number }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  // Geocoding runs 6-at-a-time (to respect the map service's rate limit). Rather
  // than make the admin click repeatedly, loop automatically until everything
  // that CAN be placed is placed — stopping when a batch makes no progress
  // (the leftovers are "remote / no address" listings that can never be pinned).
  async function run() {
    setBusy(true);
    let placed = 0;
    const failedNames = new Set<string>();
    let left = remaining;
    try {
      for (let i = 0; i < 60; i += 1) {
        setMessage(`Placing on the map… ${placed} done${left ? `, ~${left} to check` : ""}.`);
        const res = await fetch("/api/admin/geocode", { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Failed.");
        placed += data.updated ?? 0;
        (data.failedNames ?? []).forEach((n: string) => failedNames.add(n));
        left = data.remaining ?? 0;
        if (left <= 0) break;
        if ((data.updated ?? 0) === 0) break; // only unplaceable (no-address) listings remain
        await new Promise((r) => setTimeout(r, 700));
      }
      const remoteNote = failedNames.size
        ? ` ${failedNames.size} have no fixed address (remote / Scotland-wide) and will show in the “Scotland-wide” list instead — that’s fine.`
        : "";
      setMessage(`Done — placed ${placed} on the map.${remoteNote}`);
      router.refresh();
    } catch (e) {
      setMessage((e instanceof Error ? e.message : "Failed.") + ` (Placed ${placed} before stopping — click again to continue.)`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: "0.6rem" }}>
      <button type="button" className="p-btn p-btn--ghost" onClick={run} disabled={busy}>
        {busy ? "Placing on the map…" : `Add listings to the map (${remaining} to place)`}
      </button>
      {message && <p style={{ marginTop: "0.4rem", fontSize: "0.9rem", color: "var(--p-muted)" }}>{message}</p>}
    </div>
  );
}
