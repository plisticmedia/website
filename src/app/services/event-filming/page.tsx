import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Footer } from "@/components/Footer";
import { LaunchBanner } from "@/components/LaunchBanner";
import { SiteHeader } from "@/components/SiteHeader";
import styles from "../ServicePage.module.css";

export const metadata: Metadata = {
  title: "Event Filming | Plistic",
  description:
    "Multi-camera live event filming, full event edits, overview videos, social clips, raw footage, and complex event production from Plistic.",
};

const heroStats = [
  { label: "Coverage", body: "Up to three cameras, with gimbal footage available." },
  { label: "Edit", body: "A complete 40 to 90 minute event video as standard." },
  { label: "Afterlife", body: "Overview films, clips, and assets that keep working." },
];

const eventServices = [
  {
    title: "Multi-camera coverage",
    body: "Up to three cameras, with a gimbal available for more dynamic footage. We scale the setup to the size and complexity of your event.",
  },
  {
    title: "A fully edited event video, as standard",
    body: "Every booking includes a complete edited piece - 40 to 90 minutes depending on the event - with a clean, professional edit, colour grade, and audio mix. This is not an upsell. It is what you get as the default.",
  },
  {
    title: "Optional extras",
    body: "A punchy 5-minute overview video, ideal for social or your website. Social media clips, cut and ready to post. Raw footage, if you want everything we captured.",
  },
  {
    title: "Complex productions",
    body: "Longer days, heavier graphics, multiple interviews woven through the day's footage - we can handle all of it, scoped and agreed before we arrive so there are no surprises either way.",
  },
];

export default function EventFilmingPage() {
  return (
    <>
      <LaunchBanner />
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="service-title">
          <div className={`p-container ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>Event filming</p>
              <h1 id="service-title">
                Capture the day. <span>Keep it working</span>.
              </h1>
              <p className={styles.heroLead}>
                Multi-camera coverage that captures a live event and turns it into something evergreen, lasting well
                beyond the day itself.
              </p>
              <div className={styles.actions}>
                <Link className="p-btn" href="/pricing">
                  Get an instant estimate
                  <ArrowRight aria-hidden="true" size={18} />
                </Link>
                <Link className={`p-btn ${styles.ghost}`} href="/book">
                  <CalendarDays aria-hidden="true" size={18} />
                  Book a call
                </Link>
              </div>
            </div>

            <div className={`${styles.heroMedia} p-vf`}>
              <span className="p-vfc" aria-hidden="true" />
              <Image
                src="/assets/photos/strathclyde-inspire.jpg"
                alt="Multi-camera event recording setup with monitors and microphones"
                fill
                priority
                sizes="(max-width: 860px) 100vw, 52vw"
              />
              <div className={styles.heroStats} aria-label="Event filming service highlights">
                {heroStats.map((stat) => (
                  <div className={styles.heroStat} key={stat.label}>
                    <strong>{stat.label}</strong>
                    <span>{stat.body}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="what-we-do">
          <div className="p-container">
            <div className={styles.sectionHeader}>
              <p className="p-eyebrow">Event production</p>
              <h2 id="what-we-do">What we do</h2>
            </div>
            <div className={`${styles.offerGrid} ${styles.fourGrid}`}>
              {eventServices.map((service) => (
                <article className={styles.offerCard} key={service.title}>
                  <h3>{service.title}</h3>
                  <p>{service.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={`p-section ${styles.feature}`} aria-labelledby="why-film-properly">
          <div className="p-container">
            <div className={styles.sectionHeader}>
              <p className="p-eyebrow">Why film properly</p>
              <h2 id="why-film-properly">Why it&apos;s worth filming properly</h2>
            </div>
            <div className={styles.featureBox}>
              <div className={styles.featureMark}>
                <p>
                  Make the
                  <br />
                  day last <span>longer</span>.
                </p>
              </div>
              <div className={styles.featureCopy}>
                <p>
                  A great event disappears the moment it ends - unless someone captured it properly. The conversations,
                  the energy, the reactions in the room: all of it can keep working for you long after the day itself,
                  on your website, in your next pitch, on social media, wherever it is useful.
                </p>
                <p>
                  That only happens if the filming and the edit are both done well.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.cta} aria-labelledby="event-cta">
          <div className={`p-container ${styles.ctaInner}`}>
            <div>
              <p className={styles.kicker}>Next step</p>
              <h2 id="event-cta">Ready to start?</h2>
              <p>
                Get an instant price range through our quote tool, or book a free call and we will talk it through
                together.
              </p>
            </div>
            <div className={styles.ctaActions}>
              <Link className={`p-btn ${styles.whiteButton}`} href="/pricing">
                Get an instant estimate
                <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <Link className={`p-btn ${styles.outlineButton}`} href="/book">
                <CalendarDays aria-hidden="true" size={18} />
                Book a call
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
