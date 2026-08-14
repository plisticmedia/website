"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import styles from "../orders/Orders.module.css";

type Stage = { title: string; amount: string };

function gbp(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

/**
 * Seller's custom-offer builder. The seller chooses one payment on final
 * approval, OR staged milestones they fully customise (any number of stages,
 * each with its own name and price). The buyer sees the breakdown before paying.
 */
export function CustomOfferForm({ action }: { action: (formData: FormData) => void | Promise<void> }) {
  const [staged, setStaged] = useState(false);
  const [stages, setStages] = useState<Stage[]>([
    { title: "Deposit to start", amount: "" },
    { title: "On completion", amount: "" },
  ]);

  const total = stages.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  function setStage(i: number, patch: Partial<Stage>) {
    setStages((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function addStage() {
    setStages((prev) => [...prev, { title: "", amount: "" }]);
  }
  function removeStage(i: number) {
    setStages((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  }

  // Serialise stages into the hidden field the server action reads.
  const milestonesJson = staged
    ? JSON.stringify(
        stages
          .filter((s) => s.title.trim() && Number(s.amount) > 0)
          .map((s) => ({ title: s.title.trim(), amount_gbp: Number(s.amount) })),
      )
    : "";

  return (
    <form action={action} className={styles.offerForm}>
      <p className={styles.offerHint}>
        A one-off priced offer just for this buyer — e.g. extra revisions, an add-on, or a bespoke job. They accept
        and pay it from their orders page; their payment is held safely in escrow.
      </p>
      <input name="title" type="text" required maxLength={160} placeholder="Title — e.g. Bespoke 3-min brand film" />
      <textarea name="description" rows={2} maxLength={4000} placeholder="What's included (optional)" />

      <label className={styles.offerToggle}>
        <input type="checkbox" checked={staged} onChange={(e) => setStaged(e.target.checked)} />
        <span>
          Get paid in stages (milestones). Off = a single payment released to you when the buyer approves the finished
          work.
        </span>
      </label>

      {!staged ? (
        <div className={styles.offerRow}>
          <input name="price_gbp" type="number" min="0.5" step="0.01" required placeholder="Price £" />
          <input name="revision_limit" type="number" min="0" step="1" placeholder="Revisions (optional)" />
          <input name="delivery_days" type="number" min="0" step="1" placeholder="Days (optional)" />
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
                onClick={() => removeStage(i)}
                className={styles.stageRemove}
                aria-label={`Remove stage ${i + 1}`}
                disabled={stages.length <= 1}
              >
                <X aria-hidden="true" size={15} />
              </button>
            </div>
          ))}
          <button type="button" onClick={addStage} className={styles.linkBtn}>
            <Plus aria-hidden="true" size={14} /> Add a stage
          </button>
          <p className={styles.stageTotal}>Total: {gbp(total)}</p>
          <input type="hidden" name="milestones_json" value={milestonesJson} />
          <div className={styles.offerRow}>
            <input name="revision_limit" type="number" min="0" step="1" placeholder="Revisions (optional)" />
            <input name="delivery_days" type="number" min="0" step="1" placeholder="Total days (optional)" />
          </div>
        </div>
      )}

      <button type="submit" className="p-btn p-btn--ghost">Send offer</button>
    </form>
  );
}
