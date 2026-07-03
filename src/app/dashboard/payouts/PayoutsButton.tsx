"use client";

import { useState } from "react";

/**
 * Starts or resumes Stripe Connect onboarding. Mirrors FeatureCard's POST →
 * { url } → redirect pattern.
 */
export function PayoutsButton({ label }: { label: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function go() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/connect/onboard", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.href = data.url as string;
        return;
      }
      setError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setBusy(false);
  }

  return (
    <div>
      <button type="button" className="p-btn" onClick={go} disabled={busy}>
        {busy ? "Opening…" : label}
      </button>
      {error && <p style={{ color: "var(--p-coral, #f06d45)", fontSize: "0.85rem", marginTop: "0.4rem" }}>{error}</p>}
    </div>
  );
}
