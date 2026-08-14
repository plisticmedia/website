"use client";

import { MilestoneStages } from "../MilestoneStages";
import styles from "../orders/Orders.module.css";

/**
 * Seller's custom-offer builder. The seller chooses one payment on final
 * approval, OR staged milestones they fully customise (via MilestoneStages).
 * The buyer sees the breakdown before paying.
 */
export function CustomOfferForm({ action }: { action: (formData: FormData) => void | Promise<void> }) {
  return (
    <form action={action} className={styles.offerForm}>
      <p className={styles.offerHint}>
        A one-off priced offer just for this buyer — e.g. extra revisions, an add-on, or a bespoke job. They accept
        and pay it from their orders page; their payment is held safely in escrow.
      </p>
      <input name="title" type="text" required maxLength={160} placeholder="Title — e.g. Bespoke 3-min brand film" />
      <textarea name="description" rows={2} maxLength={4000} placeholder="What's included (optional)" />

      <MilestoneStages />

      <div className={styles.offerRow}>
        <input name="revision_limit" type="number" min="0" step="1" placeholder="Revisions (optional)" />
        <input name="delivery_days" type="number" min="0" step="1" placeholder="Days (optional)" />
      </div>

      <button type="submit" className="p-btn p-btn--ghost">Send offer</button>
    </form>
  );
}
