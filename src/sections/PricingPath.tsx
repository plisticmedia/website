import { PricingCalculator } from "@/components/PricingCalculator";
import styles from "./PricingPath.module.css";

export function PricingPath() {
  return (
    <section className={`p-section p-dark ${styles.pricing}`} id="pricing" aria-labelledby="pricing-title">
      <div className="p-container">
        <div className={styles.header}>
          <p className="p-eyebrow">Pricing</p>
          <h2 id="pricing-title" className="p-h2">
            Scope the job. Get the <span className="azu">range</span>.
          </h2>
          <p className="p-lead">
            A live estimator for podcast production, event filming, coaching and documentary briefs, built from
            Plistic&apos;s current pricing sheet.
          </p>
        </div>

        <PricingCalculator />
      </div>
    </section>
  );
}
