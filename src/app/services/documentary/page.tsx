import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Footer } from "@/components/Footer";
import { LaunchBanner } from "@/components/LaunchBanner";
import { SiteHeader } from "@/components/SiteHeader";
import styles from "../ServicePage.module.css";

export const metadata: Metadata = {
  title: "Documentary | Plistic",
  description:
    "Research-led documentary production, contributor sourcing, accessibility-first filming, storyboarding, filming, and complete post-production from Plistic.",
};

const heroStats = [
  { label: "Research", body: "Findings, data, and arguments translated into story." },
  { label: "Subjects", body: "Contributor sourcing, pre-screening, and preparation." },
  { label: "Care", body: "Production shaped around accessibility, trust, and pacing." },
];

const documentaryServices = [
  {
    title: "From research to story",
    body: "If your documentary is grounded in research, data, or findings of any kind, we specialise in translating that into something a human audience actually wants to watch. Evidence and argument structure a research paper. People and moments structure a film. Bridging that gap is some of the most rewarding work we do.",
  },
  {
    title: "Subject sourcing and pre-screening",
    body: "We don't just film who we're given - we help find the right people to carry your story, and we screen and prepare every contributor before a camera is ever switched on.",
  },
  {
    title: "Accessibility and care as standard",
    body: "Some of our documentary work has involved subjects with a wide range of accessibility needs, and sensitive, personal subject matter. We build every stage of production - scheduling, location, pacing, format - around what allows people to show up as their most authentic selves. This isn't a special accommodation. It's how we make documentaries.",
  },
  {
    title: "Full production",
    body: "Storyboarding, filming, and complete post-production, handled end to end.",
  },
];

const documentaryRates = [
  {
    title: "Short documentary",
    range: <>From &pound;12,000</>,
    body: "Under 30 minutes.",
  },
  {
    title: "Feature documentary",
    range: <>&pound;20,000-&pound;40,000</>,
    body: "45-90 minutes.",
  },
  {
    title: "Complex or multi-location projects",
    range: "Quoted individually",
    body: "No fixed ceiling.",
  },
];

export default function DocumentaryPage() {
  return (
    <>
      <LaunchBanner />
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="service-title">
          <div className={`p-container ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>Documentary</p>
              <h1 id="service-title">
                Stories that deserve <span>real depth</span>.
              </h1>
              <p className={styles.heroLead}>
                This is the work we're most proud of. Long-form storytelling, built from research, real subjects, and
                real care - for the projects that deserve more depth than a standard production can give them.
              </p>
              <div className={styles.actions}>
                <Link className={`p-btn ${styles.ghost}`} href="/book">
                  <CalendarDays aria-hidden="true" size={18} />
                  Book a call to discuss your project
                </Link>
              </div>
            </div>

            <div className={`${styles.heroMedia} p-vf`}>
              <span className="p-vfc" aria-hidden="true" />
              <Image
                src="/assets/photos/documentary-interview.webp"
                alt="Documentary interview subjects seated for filming"
                fill
                priority
                sizes="(max-width: 860px) 100vw, 52vw"
              />
              <div className={styles.heroStats} aria-label="Documentary service highlights">
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

        <section className={styles.section} aria-labelledby="documentary-involves">
          <div className="p-container">
            <div className={styles.sectionHeader}>
              <p className="p-eyebrow">Documentary production</p>
              <h2 id="documentary-involves">What documentary work involves</h2>
              <p className={styles.sectionIntro}>
                Documentary is different from everything else we do, and we treat it that way. Every project starts from
                scratch: understanding what you're trying to say, who needs to say it, and what shape will let the
                story land the way it should.
              </p>
            </div>
            <div className={`${styles.offerGrid} ${styles.fourGrid}`}>
              {documentaryServices.map((service) => (
                <article className={styles.offerCard} key={service.title}>
                  <h3>{service.title}</h3>
                  <p>{service.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.dark}`} aria-labelledby="documentary-costs">
          <div className="p-container">
            <div className={styles.sectionHeader}>
              <p className="p-eyebrow">Guide pricing</p>
              <h2 id="documentary-costs">What this kind of project costs</h2>
              <p>
                Documentary is bespoke by nature, and pricing reflects that. As a guide:
              </p>
            </div>
            <div className={styles.rateGrid}>
              {documentaryRates.map((rate) => (
                <article className={styles.rateCard} key={rate.title}>
                  <h3>{rate.title}</h3>
                  <p>{rate.body}</p>
                  <strong>{rate.range}</strong>
                </article>
              ))}
            </div>
            <p className={styles.rateNote}>
              These numbers exist to set expectations honestly, not to put you off - a documentary is a significant
              undertaking, and getting it right is worth the investment.
            </p>
          </div>
        </section>

        <section className={styles.cta} aria-labelledby="documentary-cta">
          <div className={`p-container ${styles.ctaInner}`}>
            <div>
              <p className={styles.kicker}>Next step</p>
              <h2 id="documentary-cta">Have a story that needs telling?</h2>
              <p>
                Tell us a little about your project and book a call directly - no form to complete first, no waiting to
                hear back.
              </p>
            </div>
            <div className={styles.ctaActions}>
              <Link className={`p-btn ${styles.whiteButton}`} href="/book">
                <CalendarDays aria-hidden="true" size={18} />
                Book a call to discuss your project
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
