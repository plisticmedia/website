"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Prompts for a TOTP code and steps the current session up to AAL2, then sends
 * the admin into /admin. Used when an admin has 2FA enabled but this session
 * hasn't completed the second factor yet.
 */
export function StepUpForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = code.replace(/\s/g, "");
    if (clean.length !== 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: factors, error: fErr } = await supabase.auth.mfa.listFactors();
      if (fErr) throw fErr;
      const factor = (factors?.totp ?? []).find((f) => f.status === "verified");
      if (!factor) {
        router.replace("/dashboard/security?admin=1");
        return;
      }
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: factor.id });
      if (cErr) throw cErr;
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: factor.id,
        challengeId: challenge.id,
        code: clean,
      });
      if (vErr) throw vErr;
      router.replace("/admin");
      router.refresh();
    } catch (e) {
      const msg = e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : "";
      setError(msg || "That code didn't match. Check your app and try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="123456"
        maxLength={7}
        autoFocus
        style={{
          fontSize: "1.6rem",
          letterSpacing: "0.35em",
          padding: "0.6rem 0.8rem",
          width: "9ch",
          border: "1px solid var(--p-line)",
          borderRadius: "10px",
          fontFamily: "var(--p-display, monospace)",
        }}
      />
      <div style={{ marginTop: "1rem" }}>
        <button type="submit" className="p-btn" disabled={busy}>
          {busy ? "Verifying…" : "Verify & continue"}
        </button>
      </div>
      {error && <p style={{ color: "var(--p-coral, #f06d45)", fontSize: "0.85rem", marginTop: "0.6rem" }}>{error}</p>}
    </form>
  );
}
