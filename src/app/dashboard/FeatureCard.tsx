"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import styles from "./DashboardPage.module.css";

export function FeatureCard({ active }: { active: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function go(endpoint: string, body?: Record<string, string>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
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
    <article className={styles.card}>
      <span className={styles.cardIcon}>
        <Sparkles aria-hidden="true" size={20} />
      </span>
      <h2>Feature your listings</h2>
      <p>
        {active
          ? "Your listings are featured — boosted to the top of the directory with a badge."
          : "Boost all your listings to the top of the directory, with a trusted badge and a spot in the showcase."}
      </p>
      {active ? (
        <button type="button" className="p-btn p-btn--ghost" onClick={() => go("/api/stripe/portal")} disabled={busy}>
          {busy ? "Opening…" : "Manage subscription"}
        </button>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          <button type="button" className="p-btn" onClick={() => go("/api/stripe/checkout", { plan: "yearly" })} disabled={busy}>
            {busy ? "Starting…" : "Feature — yearly"}
          </button>
          <button type="button" className="p-btn p-btn--ghost" onClick={() => go("/api/stripe/checkout", { plan: "monthly" })} disabled={busy}>
            or monthly
          </button>
        </div>
      )}
      {error && <p style={{ color: "var(--p-coral, #f06d45)", fontSize: "0.85rem", marginTop: "0.4rem" }}>{error}</p>}
    </article>
  );
}
