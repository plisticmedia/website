"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Sources logos from each listing's website. Loops the batched endpoint (each
 * call is time-budgeted) until no more can be fetched, so it's one click.
 */
export function WebsiteLogosButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function run() {
    setBusy(true);
    let got = 0;
    let couldnt = 0;
    try {
      for (let i = 0; i < 40; i += 1) {
        setMessage(`Fetching logos from websites… ${got} found so far.`);
        const res = await fetch("/api/admin/website-logos", { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Failed.");
        got += data.updated ?? 0;
        couldnt = data.failed ?? 0;
        if ((data.remaining ?? 0) <= 0) break;
        if ((data.updated ?? 0) === 0) break; // the rest have no findable logo
        await new Promise((r) => setTimeout(r, 400));
      }
      const note = couldnt ? ` Some sites had no logo we could read — those stay blank until the business adds one.` : "";
      setMessage(`Done — added ${got} logo(s) from websites.${note}`);
      router.refresh();
    } catch (e) {
      setMessage((e instanceof Error ? e.message : "Failed.") + ` (Added ${got} before stopping — click again to continue.)`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: "0.6rem" }}>
      <button type="button" className="p-btn p-btn--ghost" onClick={run} disabled={busy}>
        {busy ? "Fetching…" : "Fetch logos from business websites"}
      </button>
      {message && <p style={{ marginTop: "0.4rem", fontSize: "0.9rem", color: "var(--p-muted)" }}>{message}</p>}
    </div>
  );
}
