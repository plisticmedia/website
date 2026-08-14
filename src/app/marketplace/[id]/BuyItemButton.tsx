"use client";

import { useState } from "react";
import styles from "../Marketplace.module.css";

/**
 * Starts checkout for a marketplace item. Signed-out buyers are sent to log in
 * first (they need an account to track the order, confirm receipt and review).
 * Quantity is capped by stock when the seller tracks it.
 */
export function BuyItemButton({
  productId,
  priceLabel,
  maxQty,
}: {
  productId: string;
  priceLabel: string;
  maxQty: number | null;
}) {
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const cap = maxQty && maxQty > 0 ? Math.min(maxQty, 50) : 50;

  async function buy() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/marketplace/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: qty }),
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
    <div>
      {cap > 1 && (
        <label className={styles.qtyRow}>
          <span>Quantity</span>
          <select value={qty} onChange={(e) => setQty(Number(e.target.value))} disabled={busy}>
            {Array.from({ length: cap }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      )}
      <button
        type="button"
        className="p-btn"
        onClick={buy}
        disabled={busy}
        style={{ width: "100%", justifyContent: "center" }}
      >
        {busy ? "Starting…" : `Buy now — ${priceLabel}`}
      </button>
      {error && (
        <p role="alert" style={{ margin: "0.6rem 0 0", color: "#b4231f", fontSize: "0.88rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}
