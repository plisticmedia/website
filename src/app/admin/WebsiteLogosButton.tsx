"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Enriches listings from their websites — description, cover image and logo.
 * Loops the batched endpoint (each call is time-budgeted) until done, so it's
 * one click.
 */
export function WebsiteLogosButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function run() {
    setBusy(true);
    let got = 0;
    try {
      for (let i = 0; i < 40; i += 1) {
        setMessage(`Reading websites… enriched ${got} so far.`);
        const res = await fetch("/api/admin/website-logos", { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Failed.");
        got += data.updated ?? 0;
        if ((data.remaining ?? 0) <= 0) break;
        if ((data.updated ?? 0) === 0) break; // the rest have nothing more we can read
        await new Promise((r) => setTimeout(r, 400));
      }
      setMessage(`Done — added info/logos to ${got} listing(s) from their websites. Sites with nothing readable stay as-is; businesses can fill the rest when they claim.`);
      router.refresh();
    } catch (e) {
      setMessage((e instanceof Error ? e.message : "Failed.") + ` (Enriched ${got} before stopping — click again to continue.)`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: "0.6rem" }}>
      <button type="button" className="p-btn p-btn--ghost" onClick={run} disabled={busy}>
        {busy ? "Reading websites…" : "Fetch info & logos from websites"}
      </button>
      {message && <p style={{ marginTop: "0.4rem", fontSize: "0.9rem", color: "var(--p-muted)" }}>{message}</p>}
    </div>
  );
}
