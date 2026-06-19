import type { Metadata } from "next";
import { Clock3, ShieldCheck } from "lucide-react";
import { Footer } from "@/components/Footer";
import { LaunchBanner } from "@/components/LaunchBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { calendlyEmbedUrl } from "@/data/site";
import styles from "./BookPage.module.css";

export const metadata: Metadata = {
  title: "Book a Call | Plistic",
  description: "Book a catch-up call with Plistic to talk through your podcast, video, event, or documentary project.",
};

export default function BookPage() {
  return (
    <>
      <LaunchBanner />
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="book-title">
          <div className={`p-container ${styles.heroGrid}`}>
            <div className={styles.copy}>
              <p className={styles.kicker}>Book a call</p>
              <h1 id="book-title">
                Talk through the <span>project</span>.
              </h1>
              <p className={styles.lead}>
                Choose a time that works and we will use the call to understand the scope, confirm the right next step,
                and answer any questions before production begins.
              </p>
              <div className={styles.points} aria-label="Call details">
                <span>
                  <Clock3 aria-hidden="true" size={18} />
                  30-minute catch-up
                </span>
                <span>
                  <ShieldCheck aria-hidden="true" size={18} />
                  No charge on booking
                </span>
              </div>
            </div>

            <div className={`${styles.schedulerFrame} p-vf`} aria-label="Calendly booking calendar">
              <span className="p-vfc" aria-hidden="true" />
              <iframe
                title="Book a Plistic call on Calendly"
                src={calendlyEmbedUrl}
                loading="eager"
                allow="fullscreen"
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
