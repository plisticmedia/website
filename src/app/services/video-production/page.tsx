import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Footer } from "@/components/Footer";
import { LaunchBanner } from "@/components/LaunchBanner";
import { SiteHeader } from "@/components/SiteHeader";
import styles from "../ServicePage.module.css";

export const metadata: Metadata = {
  title: "Video Production | Plistic",
  description:
    "Corporate video, brand films, advertising, music videos, social content, strategy, and on-camera coaching from Plistic.",
};

const heroStats = [
  { label: "Strategy", body: "Audience, format, message, and creative direction." },
  { label: "Production", body: "Corporate films, adverts, music videos, and social content." },
  { label: "Coaching", body: "Support for founders, spokespeople, and first-time talent." },
];

const videoServices = [
  {
    title: "Corporate and brand video",
    body: "The kind of video that actually represents who you are - not a generic stock-footage approximation of your industry.",
  },
  {
    title: "Advertising",
    body: "Concept-led ad production for YouTube, social, and Spotify. We develop the idea as much as we execute it.",
  },
  {
    title: "Music videos",
    body: "Some of our most ambitious work. Recent projects have taken us into a newsroom, a near-3,000 square metre warehouse with pyrotechnics and drones, and a full-scale choreography shoot - twelve videos across eighteen months, each one pushing further than the last.",
  },
  {
    title: "Social and short-form content",
    body: "Built for the platform it is going on, not just shrunk down from something longer.",
  },
];

export default function VideoProductionPage() {
  return (
    <>
      <LaunchBanner />
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="service-title">
          <div className={`p-container ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>Video</p>
              <h1 id="service-title">
                Made with the <span>same ambition</span>.
              </h1>
              <p className={styles.heroLead}>
                Corporate video, brand films, advertising, and music videos - made with the same creative ambition
                regardless of the brief. If it is worth making, it is worth making well.
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
                src="/assets/photos/music-video-camera.webp"
                alt="Camera operator filming a music video performance"
                fill
                priority
                sizes="(max-width: 860px) 100vw, 52vw"
              />
              <div className={styles.heroStats} aria-label="Video production service highlights">
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

        <section className={styles.section} aria-labelledby="what-we-make">
          <div className="p-container">
            <div className={styles.sectionHeader}>
              <p className="p-eyebrow">Video services</p>
              <h2 id="what-we-make">What we make</h2>
            </div>
            <div className={`${styles.offerGrid} ${styles.fourGrid}`}>
              {videoServices.map((service) => (
                <article className={styles.offerCard} key={service.title}>
                  <h3>{service.title}</h3>
                  <p>{service.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={`p-section ${styles.feature}`} aria-labelledby="behind-camera">
          <div className="p-container">
            <div className={styles.sectionHeader}>
              <p className="p-eyebrow">Process</p>
              <h2 id="behind-camera">What&apos;s behind the camera</h2>
            </div>
            <div className={styles.featureBox}>
              <div className={styles.featureMark}>
                <p>
                  Know what
                  <br />
                  the film must <span>do</span>.
                </p>
              </div>
              <div className={styles.featureCopy}>
                <p>
                  Every video project starts with strategy, not a shot list. We work through who the audience actually
                  is, what the video needs to achieve, and what format will get it there - before a single frame is
                  planned.
                </p>
                <p>
                  If your project involves people on camera - a founder, a spokesperson, a team member who has never
                  been filmed before - we also offer on-camera coaching to help them perform at their best. Looking
                  comfortable on camera is rarely instinctive, and a few minutes of the right guidance before recording
                  starts makes a visible difference in the final film.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.cta} aria-labelledby="video-cta">
          <div className={`p-container ${styles.ctaInner}`}>
            <div>
              <p className={styles.kicker}>Next step</p>
              <h2 id="video-cta">Ready to start?</h2>
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
