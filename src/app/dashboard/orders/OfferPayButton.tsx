"use client";

import { useState } from "react";

/**
 * Buyer accepts + pays a custom offer. Signed-out users shouldn't reach this
 * (the page requires auth), but we still handle the sign-in redirect for safety.
 */
export function OfferPayButton({ offerId, priceLabel }: { offerId: string; priceLabel: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function accept() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/offers/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 && data.code === "signin") {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
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
    <>
      <button type="button" className="p-btn" onClick={accept} disabled={busy}>
        {busy ? "Starting…" : `Accept & pay — ${priceLabel}`}
      </button>
      {error && (
        <p role="alert" style={{ width: "100%", margin: "0.4rem 0 0", color: "#b4231f", fontSize: "0.85rem" }}>
          {error}
        </p>
      )}
    </>
  );
}
