"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Stage = "status" | "enrolling" | "verifying";

/**
 * Enrol / manage a TOTP authenticator (2FA). Uses Supabase's MFA API entirely
 * on the client: enroll → show QR + secret → user scans → verify a 6-digit code.
 * Verifying steps the current session up to AAL2, so an admin can proceed
 * straight to /admin afterwards.
 */
export function TwoFactorSetup({ hasFactor, isAdmin }: { hasFactor: boolean; isAdmin: boolean }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("status");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const supabase = createSupabaseBrowserClient();

  async function clearUnverified() {
    const { data } = await supabase.auth.mfa.listFactors();
    for (const f of data?.all ?? []) {
      if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
  }

  async function startSetup() {
    setBusy(true);
    setError("");
    try {
      await clearUnverified();
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Authenticator ${new Date().toISOString().slice(0, 16)}`,
      });
      if (error) throw error;
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStage("enrolling");
    } catch (e) {
      setError(readErr(e, "Could not start setup. Please try again."));
    }
    setBusy(false);
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = code.replace(/\s/g, "");
    if (clean.length !== 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
      if (cErr) throw cErr;
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: clean,
      });
      if (vErr) throw vErr;
      setStage("verifying");
      // Session is now AAL2. Send admins straight to the panel they were headed for.
      router.replace(isAdmin ? "/admin" : "/dashboard/security");
      router.refresh();
    } catch (e) {
      setError(readErr(e, "That code didn't match. Check your app and try again."));
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Turn off two-factor authentication? Your account will be less protected.")) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await supabase.auth.mfa.listFactors();
      for (const f of data?.all ?? []) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      router.refresh();
    } catch (e) {
      setError(readErr(e, "Could not turn it off. Please try again."));
      setBusy(false);
    }
  }

  if (stage === "status" && hasFactor) {
    return (
      <div>
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CheckCircle2 aria-hidden="true" size={22} color="#1a7f37" /> Two-factor is on
        </h2>
        <p>Your account is protected. You&apos;ll enter a code from your authenticator app when you sign in.</p>
        <button type="button" className="p-btn p-btn--ghost" onClick={remove} disabled={busy}>
          {busy ? "Working…" : "Turn off two-factor"}
        </button>
        {error && <p style={errStyle}>{error}</p>}
      </div>
    );
  }

  if (stage === "enrolling") {
    return (
      <div>
        <h2>Scan this with your authenticator app</h2>
        <p>Open Google Authenticator, Authy, 1Password or similar, add a new account, and scan the code.</p>
        {qr && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="QR code to set up two-factor authentication" width={180} height={180} style={{ margin: "0.5rem 0" }} />
        )}
        <p style={{ fontSize: "0.85rem", color: "var(--p-muted)" }}>
          Can&apos;t scan? Enter this key manually:
          <br />
          <code style={{ fontSize: "0.95rem", wordBreak: "break-all" }}>{secret}</code>
        </p>
        <form onSubmit={verify} style={{ marginTop: "0.8rem" }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: "0.4rem" }}>
            Enter the 6-digit code it shows
          </label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            maxLength={7}
            style={inputStyle}
          />
          <div style={{ marginTop: "0.8rem", display: "flex", gap: "0.6rem" }}>
            <button type="submit" className="p-btn" disabled={busy}>
              {busy ? "Checking…" : "Turn on two-factor"}
            </button>
            <button type="button" className="p-btn p-btn--ghost" onClick={() => setStage("status")} disabled={busy}>
              Cancel
            </button>
          </div>
          {error && <p style={errStyle}>{error}</p>}
        </form>
      </div>
    );
  }

  if (stage === "verifying") {
    return <p>Two-factor enabled — taking you through…</p>;
  }

  // status stage, no factor yet
  return (
    <div>
      <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <ShieldCheck aria-hidden="true" size={22} /> Two-factor is off
      </h2>
      <p>Protect your account with a code from your phone in addition to your password.</p>
      <button type="button" className="p-btn" onClick={startSetup} disabled={busy}>
        {busy ? "Starting…" : "Set up two-factor"}
      </button>
      {error && <p style={errStyle}>{error}</p>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  fontSize: "1.4rem",
  letterSpacing: "0.3em",
  padding: "0.5rem 0.7rem",
  width: "8ch",
  border: "1px solid var(--p-line)",
  borderRadius: "10px",
  fontFamily: "var(--p-display, monospace)",
};
const errStyle: React.CSSProperties = { color: "var(--p-coral, #f06d45)", fontSize: "0.85rem", marginTop: "0.6rem" };

function readErr(e: unknown, fallback: string): string {
  const msg = e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : "";
  return msg || fallback;
}
