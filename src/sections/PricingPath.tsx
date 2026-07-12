import { PricingCalculator } from "@/components/PricingCalculator";
import type { ServiceChoice } from "@/lib/pricing";
import styles from "./PricingPath.module.css";

export function PricingPath({ initialService }: { initialService?: ServiceChoice }) {
  return (
    <section className={`p-section p-dark ${styles.pricing}`} id="pricing" aria-labelledby="pricing-title">
      <div className="p-container">
        <div className={styles.header}>
          <p className="p-eyebrow">Pricing</p>
          <h2 id="pricing-title" className="p-h2">
            Scope the job. Get the <span className="azu">range</span>.
          </h2>
          <p className="p-lead">
            A live estimator for all our services.
          </p>
          <p className={styles.disclaimer}>
            Prices shown here are estimates only. They are not fixed quotes and may change once we understand the full
            scope of your project. Full costings will be discussed and confirmed on your call.
          </p>
        </div>

        <PricingCalculator initialService={initialService} />
      </div>
    </section>
  );
}
