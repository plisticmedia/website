import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Footer } from "@/components/Footer";
import { LaunchBanner } from "@/components/LaunchBanner";
import { SiteHeader } from "@/components/SiteHeader";
import styles from "../ServicePage.module.css";

export const metadata: Metadata = {
  title: "Coaching | Plistic",
  description:
    "Presentation and media coaching from Plistic — podcast and host coaching, on-camera confidence, founder and spokesperson media training, and team workshops.",
};

const heroStats = [
  { label: "Format", body: "Remote or in person, a single session or a block." },
  { label: "For", body: "Hosts, founders, spokespeople and whole teams." },
  { label: "Outcome", body: "Calm, natural, and sounding like yourself." },
];

const coachingServices = [
  {
    title: "Podcast & host coaching",
    body: "Interviewing, pacing, listening and steering a conversation - so your show feels easy and you come across as a natural host, not someone reading questions off a page.",
  },
  {
    title: "On-camera confidence",
    body: "How to hold yourself, where to look, and how to speak to a lens so you land as warm and credible on screen instead of stiff or self-conscious.",
  },
  {
    title: "Founder & spokesperson media training",
    body: "Get your message across under pressure - interviews, panels, pitches and press - with clear key messages and a calm, confident delivery you can rely on.",
  },
  {
    title: "Team workshops",
    body: "Bring a group up to speed together on presenting, recording and speaking on camera, with practical exercises everyone can put to use straight away.",
  },
];

export default function CoachingPage() {
  return (
    <>
      <LaunchBanner />
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="service-title">
          <div className={`p-container ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>Coaching</p>
              <h1 id="service-title">
                Feel ready. Sound like <span>yourself</span>.
              </h1>
              <p className={styles.heroLead}>
                Presentation and media coaching for anyone who needs to show up well on a mic or camera - hosts,
                founders and teams. We set you up to feel calm, natural and in control before the record light comes on.
              </p>
              <div className={styles.actions}>
                <Link className="p-btn" href="/pricing?service=coaching#pricing">
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
                src="/assets/photos/podcast-monitor.webp"
                alt="A host being coached before recording"
                fill
                priority
                sizes="(max-width: 860px) 100vw, 52vw"
                style={{ objectPosition: "center top" }}
              />
              <div className={styles.heroStats} aria-label="Coaching service highlights">
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
              <p className="p-eyebrow">Coaching</p>
              <h2 id="what-we-do">What we do</h2>
            </div>
            <div className={`${styles.offerGrid} ${styles.fourGrid}`}>
              {coachingServices.map((service) => (
                <article className={styles.offerCard} key={service.title}>
                  <h3>{service.title}</h3>
                  <p>{service.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={`p-section ${styles.feature}`} aria-labelledby="why-coaching">
          <div className="p-container">
            <div className={styles.sectionHeader}>
              <p className="p-eyebrow">Why coaching</p>
              <h2 id="why-coaching">Why a little coaching goes a long way</h2>
            </div>
            <div className={styles.featureBox}>
              <div className={styles.featureMark}>
                <p>
                  Sound like
                  <br />
                  <span>yourself</span>.
                </p>
              </div>
              <div className={styles.featureCopy}>
                <p>
                  Most people don&apos;t freeze because they have nothing to say - they freeze because the mic or the
                  camera makes them second-guess it. A small amount of coaching takes that friction away: you learn what
                  to do with your hands, your voice and your nerves, and you stop performing and start talking.
                </p>
                <p>
                  The difference on the finished recording is night and day - and it sticks, for this project and every
                  one after it.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.cta} aria-labelledby="coaching-cta">
          <div className={`p-container ${styles.ctaInner}`}>
            <div>
              <p className={styles.kicker}>Next step</p>
              <h2 id="coaching-cta">Ready to feel ready?</h2>
              <p>
                Get an instant price range through our quote tool, or book a free call and we&apos;ll talk through what
                you&apos;re preparing for.
              </p>
            </div>
            <div className={styles.ctaActions}>
              <Link className={`p-btn ${styles.whiteButton}`} href="/pricing?service=coaching#pricing">
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
