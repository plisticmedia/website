import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { SubmitShowcaseForm } from "./SubmitShowcaseForm";
import styles from "../Showcase.module.css";

export const metadata: Metadata = {
  title: "Submit to the showcase | Plistic",
  description: "Put forward the best creative work, events and stories from Scotland to feature in the Plistic showcase.",
};

export default function SubmitShowcasePage() {
  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className="p-container">
            <p className={styles.kicker}>
              <Link href="/showcase" style={{ color: "var(--p-azure)" }}>Showcase</Link> / Submit
            </p>
            <h1>
              Put something <span>brilliant</span> forward.
            </h1>
            <p className={styles.lead}>
              Seen a film, event, project or story from Scotland&apos;s creative scene that deserves a wider audience?
              Tell us about it. We review everything and feature the best.
            </p>
          </div>
        </section>
        <section className={`p-container ${styles.body}`}>
          <SubmitShowcaseForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
