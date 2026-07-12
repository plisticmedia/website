import { Sparkles } from "lucide-react";
import { PricingCalculator } from "@/components/PricingCalculator";
import type { ServiceChoice } from "@/lib/pricing";
import { launchOffer, launchOfferExpiresAt } from "@/data/site";
import styles from "./PricingPath.module.css";

export function PricingPath({ initialService }: { initialService?: ServiceChoice }) {
  const offerLive = Date.now() < new Date(launchOfferExpiresAt).getTime();
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
          {offerLive && (
            <p className={styles.launchNote}>
              <Sparkles aria-hidden="true" size={16} />
              <span>
                <strong>Launch offer:</strong> {launchOffer.body} Estimates below are before the discount — we&apos;ll apply
                it on your call.
              </span>
            </p>
          )}
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
