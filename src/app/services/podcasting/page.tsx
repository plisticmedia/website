import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Footer } from "@/components/Footer";
import { LaunchBanner } from "@/components/LaunchBanner";
import { LaunchOfferPopup } from "@/components/LaunchOfferPopup";
import { SiteHeader } from "@/components/SiteHeader";
import styles from "../ServicePage.module.css";

export const metadata: Metadata = {
  title: "Podcasting | Plistic",
  description:
    "Full-service podcast production, strategy, research, recording, editing, distribution, and host coaching from Plistic.",
};

const heroStats = [
  { label: "Strategy", body: "Audience, format, cadence, and launch planning." },
  { label: "Production", body: "Audio and video podcasts, in studio or anywhere." },
  { label: "Launch", body: "Editing, publishing, clips, show notes, and SEO." },
];

const offers = [
  {
    title: "Full-service production",
    body: "Strategy, recording, editing, distribution - the whole thing, start to finish. You bring the idea, we bring everything needed to make it real.",
  },
  {
    title: "Post-production only",
    body: "Already recording? We will take your raw audio or video and turn it into a polished, ready-to-publish episode.",
  },
  {
    title: "Guest research, booking, and briefing",
    body: "We will find the right guests, manage outreach, and prepare briefing notes so every conversation starts strong.",
  },
  {
    title: "Strategy and research",
    body: "Before anything is recorded, we do the work that determines whether a show actually lands - audience research, competitor and adjacent-show analysis, the right release cadence, and the format that will actually hold attention.",
    highlight:
      "Not sure if your idea has legs? Our standalone research package gives you an honest, evidence-based read on your audience, your competition, and your format before you commit to a full series.",
  },
  {
    title: "Show notes, chapters, and scripting",
    body: "Publish-ready copy for every episode, plus full scripting support if your format needs it.",
  },
  {
    title: "Host and on-air coaching",
    body: "Confidence in front of a microphone does not always come naturally, and it should not have to. We work directly with hosts to develop delivery, presence, and comfort in the format.",
  },
  {
    title: "Social and distribution",
    body: "Short-form clips, podcast SEO, and full multi-platform distribution, so the work does not stop the moment an episode goes live.",
  },
];

const recordingOptions = [
  {
    title: "In our studio spaces",
    body: "Fully kitted and engineered, ready to go - the simplest option if you are recording in or near Glasgow.",
  },
  {
    title: "On-site, at your space",
    body: "We bring the kit to you. This often captures the energy and personality of an organisation better than a studio ever could.",
  },
  {
    title: "On location, elsewhere",
    body: "Wherever your story needs to be told, we can bring the production to it.",
  },
  {
    title: "Remote, fully managed",
    body: "We run the session, manage the recording, and handle production without anyone needing to be in the same room.",
  },
  {
    title: "Hybrid recording",
    body: "You or your host record in person while remote guests join professionally captured and mixed in, so the finished episode still feels cohesive and well-produced.",
  },
];

export default function PodcastingPage() {
  return (
    <>
      <LaunchBanner />
      <SiteHeader />
      <LaunchOfferPopup service="podcast" />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="service-title">
          <div className={`p-container ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>Podcasting</p>
              <h1 id="service-title">
                Turn a niche into a <span>community</span>.
              </h1>
              <p className={styles.heroLead}>
                A podcast is one of the only formats where a niche can become a community. We have taken shows from a
                single sentence of an idea to series that chart in their category - and we handle everything in between.
              </p>
              <div className={styles.actions}>
                <Link className="p-btn" href="/pricing?service=podcast#pricing">
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
                src="/assets/photos/site/accelerateher-3.jpg"
                alt="Podcast production setup with microphones around a table"
                fill
                priority
                sizes="(max-width: 860px) 100vw, 52vw"
              />
              <div className={styles.heroStats} aria-label="Podcasting service highlights">
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

        <section className={`p-section ${styles.feature}`} aria-label="Why a podcast">
          <div className="p-container">
            <div className={styles.featureBox}>
              <div className={styles.featureMark}>
                <p>
                  Build trust,
                  <br />
                  not just <span>reach</span>.
                </p>
              </div>
              <div className={styles.featureCopy}>
                <p>
                  Podcasting is one of the only formats that builds a genuine audience rather than just an impression.
                  The numbers back this up: 55% of listeners say they would consider buying a product after hearing
                  about it on a podcast - a higher conversion than almost any other form of marketing.
                </p>
                <p>
                  That is because a podcast does not compete for attention the way a feed or an inbox does. People
                  listen while commuting, exercising, working - building your message into their routine rather than
                  scrolling past it.
                </p>
                <p>
                  We have seen this play out even in the most unlikely categories. One independent tobacconist built a
                  podcast around the culture and craft of their product - and grew an audience so devoted that listeners
                  began travelling internationally just to visit the shop in person.
                </p>
                <p>
                  That is the real opportunity. Every business has expertise, stories, and insight that nobody else can
                  offer in quite the same way. Podcasting is simply the format built to let that come through. Done
                  properly, it does not just build an audience. It builds trust, and trust converts.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="what-we-do">
          <div className="p-container">
            <div className={styles.sectionHeader}>
              <p className="p-eyebrow">What we do</p>
              <h2 id="what-we-do">Everything a show needs to land.</h2>
            </div>
            <div className={styles.offerGrid}>
              {offers.map((offer) => (
                <article className={`${styles.offerCard} ${offer.highlight ? styles.wide : ""}`} key={offer.title}>
                  <h3>{offer.title}</h3>
                  <p>{offer.body}</p>
                  {offer.highlight ? <p className={styles.researchCta}>{offer.highlight}</p> : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.dark}`} aria-labelledby="where-we-record">
          <div className="p-container">
            <div className={styles.sectionHeader}>
              <p className="p-eyebrow">How and where we record</p>
              <h2 id="where-we-record">Built around the show, not the other way round.</h2>
              <p>
                We produce both audio and video podcasts, and we work around whatever recording setup actually suits
                your show and your guests.
              </p>
            </div>
            <div className={styles.recordingGrid}>
              {recordingOptions.map((option) => (
                <article className={styles.recordingCard} key={option.title}>
                  <h3>{option.title}</h3>
                  <p>{option.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.cta} aria-labelledby="podcasting-cta">
          <div className={`p-container ${styles.ctaInner}`}>
            <div>
              <p className={styles.kicker}>Next step</p>
              <h2 id="podcasting-cta">Ready to start?</h2>
              <p>Get an instant price range through our quote tool, or book a free call and we will talk it through together.</p>
            </div>
            <div className={styles.ctaActions}>
              <Link className={`p-btn ${styles.whiteButton}`} href="/pricing?service=podcast#pricing">
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
