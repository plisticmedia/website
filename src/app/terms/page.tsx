import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { LaunchBanner } from "@/components/LaunchBanner";
import { LegalDocument } from "@/components/LegalDocument";
import { SiteHeader } from "@/components/SiteHeader";
import { termsDocument } from "@/data/legal";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Terms and Conditions | Plistic",
  description: "Plistic terms and conditions of service.",
};

export default function TermsPage() {
  return (
    <>
      <LaunchBanner />
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={`p-container ${styles.heroInner}`}>
            <p className="p-eyebrow">Legal</p>
            <h1>{termsDocument.heroTitle}</h1>
            <p>{termsDocument.heroDescription}</p>
          </div>
        </section>

        <section className={styles.content}>
          <div className="p-container">
            <LegalDocument document={termsDocument} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
