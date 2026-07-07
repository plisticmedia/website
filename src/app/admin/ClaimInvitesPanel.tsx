"use client";

import { useCallback, useEffect, useState } from "react";

type Preview = {
  eligible: number;
  alreadySent: number;
  noEmail: number;
  sample: { to: string; subject: string; text: string } | null;
};

export function ClaimInvitesPanel() {
  const [data, setData] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);
  const [batchSize, setBatchSize] = useState(10);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const loadPreview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/claim-invites");
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error ?? "Failed to load.");
      setData(d as Preview);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  async function sendBatch() {
    if (!data?.eligible) return;
    const n = Math.min(batchSize, data.eligible);
    if (!window.confirm(`Send the claim invitation to the next ${n} business${n === 1 ? "" : "es"} now? This emails real people.`)) return;
    setSending(true);
    setMessage(`Sending ${n}…`);
    try {
      const res = await fetch("/api/admin/claim-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize: n }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error ?? "Send failed.");
      const failNote = d.failed ? ` ${d.failed} failed (will retry next batch).` : "";
      setMessage(`Sent ${d.sent}.${failNote} ${d.remaining} still to send.`);
      await loadPreview();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Send failed.");
    } finally {
      setSending(false);
    }
  }

  const box: React.CSSProperties = {
    border: "1px solid var(--p-line)",
    borderRadius: 12,
    padding: "1rem 1.1rem",
    marginTop: "0.8rem",
  };

  return (
    <div style={box}>
      <h3 style={{ margin: "0 0 0.3rem" }}>Claim invitations</h3>
      <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--p-muted)" }}>
        Email each unclaimed business its private claim link. Preview below — nothing sends until you press the button.
      </p>

      {loading ? (
        <p style={{ fontSize: "0.9rem", marginTop: "0.8rem" }}>Loading…</p>
      ) : data ? (
        <>
          <p style={{ fontSize: "0.95rem", marginTop: "0.8rem", fontWeight: 600 }}>
            {data.eligible} ready to send · {data.alreadySent} already sent · {data.noEmail} have no email (skipped — handle by hand)
          </p>

          {data.eligible === 0 && data.alreadySent === 0 && data.noEmail === 0 && (
            <p style={{ fontSize: "0.9rem", color: "var(--p-coral, #f06d45)" }}>
              No imported listings have an email yet. Re-import your CSV (it now captures the Public email column), then reload this.
            </p>
          )}

          {data.sample && (
            <div style={{ ...box, background: "var(--p-paper)" }}>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--p-muted)" }}>
                Preview (example — to {data.sample.to}):
              </p>
              <p style={{ margin: "0.4rem 0 0.2rem", fontWeight: 700 }}>{data.sample.subject}</p>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: "0.9rem", lineHeight: 1.5 }}>
                {data.sample.text}
              </pre>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", flexWrap: "wrap", marginTop: "0.9rem" }}>
            <label style={{ fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              Batch size
              <input
                type="number"
                min={1}
                max={50}
                value={batchSize}
                onChange={(e) => setBatchSize(Math.min(50, Math.max(1, Number(e.target.value) || 1)))}
                style={{ width: 70, padding: "0.4rem 0.5rem", border: "1px solid var(--p-line)", borderRadius: 8 }}
              />
            </label>
            <button type="button" className="p-btn" onClick={sendBatch} disabled={sending || data.eligible === 0}>
              {sending ? "Sending…" : `Send next batch (${Math.min(batchSize, data.eligible)})`}
            </button>
            <button type="button" className="p-btn p-btn--ghost" onClick={loadPreview} disabled={sending}>
              Refresh
            </button>
          </div>
        </>
      ) : null}

      {message && <p style={{ marginTop: "0.6rem", fontSize: "0.9rem", color: "var(--p-ink)" }}>{message}</p>}
    </div>
  );
}
