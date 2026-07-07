"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RehostLogosButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function run() {
    setBusy(true);
    setMessage("Pulling logos into our storage…");
    try {
      const res = await fetch("/api/admin/rehost-logos", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed.");
      const failNote = data.failed > 0 ? ` ${data.failed} couldn't be fetched.` : "";
      const already = data.alreadyHosted ? ` ${data.alreadyHosted} already in storage.` : "";
      let diag = "";
      if (data.rehosted === 0 && !data.withLogo) {
        diag = ` None of the ${data.examined} listings have a logo link saved — the CSV's Logo column looks empty.`;
      } else if (data.rehosted === 0 && data.samples?.length) {
        diag = ` Example logo values found: ${data.samples.slice(0, 3).join("  |  ")}`;
      }
      setMessage(`Imported ${data.rehosted} logo(s) into storage.${already}${failNote}${diag}`);
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
        {busy ? "Importing…" : "Import logos into storage"}
      </button>
      {message && <p style={{ marginTop: "0.4rem", fontSize: "0.9rem", color: "var(--p-muted)" }}>{message}</p>}
    </div>
  );
}
