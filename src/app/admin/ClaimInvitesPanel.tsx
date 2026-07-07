"use client";

import { useCallback, useEffect, useState } from "react";

type Email = { to: string; subject: string; text: string };
type NoEmail = { title: string; website: string | null; claimLink: string };
type Data = {
  initialEligible: number;
  alreadySent: number;
  noEmail: number;
  followupEligible: number;
  followupSent: number;
  sampleInitial: Email | null;
  sampleFollowup: Email | null;
  noEmailList: NoEmail[];
};

const box: React.CSSProperties = { border: "1px solid var(--p-line)", borderRadius: 12, padding: "1rem 1.1rem", marginTop: "0.8rem" };

function EmailPreview({ email }: { email: Email }) {
  return (
    <div style={{ ...box, background: "var(--p-paper)" }}>
      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--p-muted)" }}>Preview (example — to {email.to}):</p>
      <p style={{ margin: "0.4rem 0 0.2rem", fontWeight: 700 }}>{email.subject}</p>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: "0.9rem", lineHeight: 1.5 }}>{email.text}</pre>
    </div>
  );
}

export function ClaimInvitesPanel() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [batchSize, setBatchSize] = useState(20);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/claim-invites");
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error ?? "Failed to load.");
      setData(d as Data);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function send(mode: "initial" | "followup", eligible: number) {
    const n = Math.min(batchSize, eligible);
    if (n < 1) return;
    const label = mode === "followup" ? "follow-up" : "invitation";
    if (!window.confirm(`Send the ${label} to the next ${n} business${n === 1 ? "" : "es"} now? This emails real people.`)) return;
    setSending(true);
    setMessage(`Sending ${n} ${label}(s)…`);
    try {
      const res = await fetch("/api/admin/claim-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize: n, mode }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error ?? "Send failed.");
      const failNote = d.failed ? ` ${d.failed} failed (will retry next batch).` : "";
      setMessage(`Sent ${d.sent} ${label}(s).${failNote} ${d.remaining} still to send.`);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Send failed.");
    } finally {
      setSending(false);
    }
  }

  function copyNoEmail() {
    if (!data) return;
    const lines = data.noEmailList.map((r) => `${r.title}\t${r.website ?? ""}\t${r.claimLink}`).join("\n");
    navigator.clipboard?.writeText(`Business\tWebsite\tClaim link\n${lines}`).then(
      () => setMessage("Copied the no-email list to your clipboard (paste into a sheet)."),
      () => setMessage("Couldn't copy — select the list manually."),
    );
  }

  return (
    <div style={box}>
      <h3 style={{ margin: "0 0 0.3rem" }}>Claim invitations</h3>
      <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--p-muted)" }}>
        Email each unclaimed business its private claim link. Preview below — nothing sends until you press a button.
      </p>

      {loading ? (
        <p style={{ fontSize: "0.9rem", marginTop: "0.8rem" }}>Loading…</p>
      ) : data ? (
        <>
          <p style={{ fontSize: "0.95rem", marginTop: "0.8rem", fontWeight: 600 }}>
            {data.initialEligible} ready · {data.alreadySent} invited · {data.noEmail} have no email · {data.followupSent} follow-ups sent
          </p>

          <label style={{ fontSize: "0.9rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem" }}>
            Batch size
            <input
              type="number" min={1} max={50} value={batchSize}
              onChange={(e) => setBatchSize(Math.min(50, Math.max(1, Number(e.target.value) || 1)))}
              style={{ width: 70, padding: "0.4rem 0.5rem", border: "1px solid var(--p-line)", borderRadius: 8 }}
            />
          </label>

          {/* First invitation */}
          <div style={box}>
            <strong>1 · First invitation</strong>
            {data.sampleInitial ? <EmailPreview email={data.sampleInitial} /> : (
              <p style={{ fontSize: "0.9rem", color: "var(--p-muted)", marginTop: "0.5rem" }}>
                {data.initialEligible === 0 && data.alreadySent === 0
                  ? "No listings have an email yet — re-import your CSV (it now captures the Public email column), then Refresh."
                  : "All invitations have been sent. 🎉"}
              </p>
            )}
            <div style={{ marginTop: "0.7rem" }}>
              <button type="button" className="p-btn" onClick={() => send("initial", data.initialEligible)} disabled={sending || data.initialEligible === 0}>
                {sending ? "Sending…" : `Send next batch (${Math.min(batchSize, data.initialEligible)})`}
              </button>
            </div>
          </div>

          {/* Follow-up */}
          <div style={box}>
            <strong>2 · One-week follow-up</strong>
            <p style={{ fontSize: "0.85rem", color: "var(--p-muted)", margin: "0.2rem 0 0" }}>
              Goes only to businesses already invited who still haven&apos;t claimed. Send this ~a week after the first. {data.followupEligible} awaiting.
            </p>
            {data.sampleFollowup && <EmailPreview email={data.sampleFollowup} />}
            <div style={{ marginTop: "0.7rem" }}>
              <button type="button" className="p-btn p-btn--ghost" onClick={() => send("followup", data.followupEligible)} disabled={sending || data.followupEligible === 0}>
                {sending ? "Sending…" : `Send follow-up batch (${Math.min(batchSize, data.followupEligible)})`}
              </button>
            </div>
          </div>

          {/* No-email list */}
          {data.noEmailList.length > 0 && (
            <details style={box}>
              <summary style={{ cursor: "pointer", fontWeight: 600 }}>{data.noEmailList.length} with no email — handle by hand</summary>
              <button type="button" className="p-btn p-btn--ghost" style={{ margin: "0.6rem 0" }} onClick={copyNoEmail}>Copy list</button>
              <div style={{ maxHeight: 260, overflowY: "auto", fontSize: "0.85rem" }}>
                {data.noEmailList.map((r, i) => (
                  <div key={i} style={{ padding: "0.35rem 0", borderTop: i ? "1px solid var(--p-line)" : "none" }}>
                    <strong>{r.title}</strong>
                    {r.website && <> · <a href={r.website} target="_blank" rel="noreferrer">{r.website}</a></>}
                    <br />
                    <a href={r.claimLink} target="_blank" rel="noreferrer" style={{ color: "var(--p-azure-deep)" }}>{r.claimLink}</a>
                  </div>
                ))}
              </div>
            </details>
          )}

          <button type="button" className="p-btn p-btn--ghost" style={{ marginTop: "0.8rem" }} onClick={load} disabled={sending}>Refresh</button>
        </>
      ) : null}

      {message && <p style={{ marginTop: "0.6rem", fontSize: "0.9rem", color: "var(--p-ink)" }}>{message}</p>}
    </div>
  );
}
