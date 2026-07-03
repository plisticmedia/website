"use client";

import { useState } from "react";
import styles from "./Listing.module.css";

/**
 * Starts checkout for a bookable package. Signed-out buyers are sent to log in
 * first (they must have an account to track the order and leave a review).
 */
export function BookButton({ packageId, priceLabel }: { packageId: string; priceLabel: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function book() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
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
    <div className={styles.bookWrap}>
      <button type="button" className="p-btn" onClick={book} disabled={busy}>
        {busy ? "Starting…" : `Book — ${priceLabel}`}
      </button>
      {error && <p className={styles.bookError}>{error}</p>}
    </div>
  );
}
