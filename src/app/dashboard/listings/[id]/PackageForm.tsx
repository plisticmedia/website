"use client";

import { MilestoneStages } from "../../MilestoneStages";
import styles from "../Listings.module.css";

/**
 * Add-a-package form. Beyond name/delivery/features, the seller can set the
 * price as a single payment OR as customisable milestones (a staged/deposit
 * plan) — the same builder used for custom offers. Milestones apply when the
 * package is bookable online; buyers then see the stages on the listing.
 */
export function PackageForm({
  action,
  payoutsReady,
}: {
  action: (formData: FormData) => void | Promise<void>;
  payoutsReady: boolean;
}) {
  return (
    <form action={action} className={styles.form}>
      <div className={styles.packageFields}>
        <label className={styles.field}>
          <span>Name *</span>
          <input name="name" type="text" required maxLength={120} placeholder="Standard" />
        </label>
        <label className={styles.field}>
          <span>Delivery (days)</span>
          <input name="delivery_days" type="number" min="0" step="1" placeholder="14" />
        </label>
      </div>

      <MilestoneStages
        priceRequired={false}
        toggleLabel="Offer this in stages (deposit + milestones). Off = a single price. Applies when the package is bookable online — buyers see the stages on your listing and each is released as they approve it."
      />

      <label className={styles.field}>
        <span>Features (one per line)</span>
        <textarea name="features" rows={3} placeholder={"2 cameras\nEdited highlight reel\nSocial cut-downs"} />
      </label>

      {payoutsReady && (
        <label className={styles.checkItem}>
          <input type="checkbox" name="bookable" /> Make this bookable online (accept secure payment through Plistic)
        </label>
      )}

      <button type="submit" className="p-btn">Add package</button>
    </form>
  );
}
