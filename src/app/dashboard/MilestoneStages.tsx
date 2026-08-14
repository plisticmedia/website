"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import styles from "./orders/Orders.module.css";

type Stage = { title: string; amount: string };

function gbp(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

/**
 * Shared "single payment vs milestones" control used by both the custom-offer
 * form and the package form. When off, renders a single `price_gbp` input; when
 * on, a fully-customisable stage builder that serialises to `milestones_json`
 * (which the server actions read). The buyer is shown the resulting breakdown
 * before paying.
 */
export function MilestoneStages({
  priceRequired = true,
  toggleLabel = "Get paid in stages (milestones). Off = a single payment released to you when the buyer approves the finished work.",
}: {
  priceRequired?: boolean;
  toggleLabel?: string;
}) {
  const [staged, setStaged] = useState(false);
  const [stages, setStages] = useState<Stage[]>([
    { title: "Deposit to start", amount: "" },
    { title: "On completion", amount: "" },
  ]);

  const total = stages.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  function setStage(i: number, patch: Partial<Stage>) {
    setStages((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  const milestonesJson = staged
    ? JSON.stringify(
        stages
          .filter((s) => s.title.trim() && Number(s.amount) > 0)
          .map((s) => ({ title: s.title.trim(), amount_gbp: Number(s.amount) })),
      )
    : "";

  return (
    <>
      <label className={styles.offerToggle}>
        <input type="checkbox" checked={staged} onChange={(e) => setStaged(e.target.checked)} />
        <span>{toggleLabel}</span>
      </label>

      {!staged ? (
        <div className={styles.offerRow}>
          <input name="price_gbp" type="number" min="0.5" step="0.01" required={priceRequired} placeholder="Price £" />
        </div>
      ) : (
        <div className={styles.stageBuilder}>
          <p className={styles.offerHint}>
            The buyer pays the total up front; each stage is released to you as they approve it. The first stage acts as
            the deposit.
          </p>
          {stages.map((s, i) => (
            <div key={i} className={styles.stageRow}>
              <input
                type="text"
                value={s.title}
                maxLength={160}
                onChange={(e) => setStage(i, { title: e.target.value })}
                placeholder={`Stage ${i + 1} name`}
              />
              <input
                type="number"
                min="0.5"
                step="0.01"
                value={s.amount}
                onChange={(e) => setStage(i, { amount: e.target.value })}
                placeholder="£"
              />
              <button
                type="button"
                onClick={() => setStages((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))}
                className={styles.stageRemove}
                aria-label={`Remove stage ${i + 1}`}
                disabled={stages.length <= 1}
              >
                <X aria-hidden="true" size={15} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setStages((prev) => [...prev, { title: "", amount: "" }])}
            className={styles.linkBtn}
          >
            <Plus aria-hidden="true" size={14} /> Add a stage
          </button>
          <p className={styles.stageTotal}>Total: {gbp(total)}</p>
          <input type="hidden" name="milestones_json" value={milestonesJson} />
        </div>
      )}
    </>
  );
}
