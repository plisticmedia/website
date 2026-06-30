import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { LaunchBanner } from "@/components/LaunchBanner";
import { LegalDocument } from "@/components/LegalDocument";
import { SiteHeader } from "@/components/SiteHeader";
import { privacyDocument } from "@/data/legal";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy | Plistic",
  description: "How Plistic collects, uses, and protects personal data.",
};

export default function PrivacyPage() {
  return (
    <>
      <LaunchBanner />
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={`p-container ${styles.heroInner}`}>
            <p className="p-eyebrow">Legal</p>
            <h1>{privacyDocument.heroTitle}</h1>
            <p>{privacyDocument.heroDescription}</p>
          </div>
        </section>

        <section className={styles.content}>
          <div className="p-container">
            <LegalDocument document={privacyDocument} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
