import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { FeedbackForm } from "./FeedbackForm";
import styles from "./Feedback.module.css";

export const metadata: Metadata = {
  title: "Share your feedback | Plistic",
  description: "Beta testers — tell us what's working and what isn't. Your feedback shapes what we build next.",
  robots: { index: false, follow: false },
};

export default function FeedbackPage() {
  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className="p-container">
            <p className={styles.kicker}>Beta feedback</p>
            <h1>
              Tell us what you <span>think</span>.
            </h1>
            <p className={styles.lead}>
              You&apos;re helping shape Plistic before it opens to everyone. Spotted something confusing, broken, or
              missing? Loved something? We read every note — it genuinely steers what we build next.
            </p>
          </div>
        </section>

        <section className={`p-container ${styles.body}`}>
          <FeedbackForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
