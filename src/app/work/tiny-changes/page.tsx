import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, ListChecks, Mic2, Sprout } from "lucide-react";
import { Footer } from "@/components/Footer";
import { LaunchBanner } from "@/components/LaunchBanner";
import { SiteHeader } from "@/components/SiteHeader";
import styles from "../WorkCaseStudy.module.css";

export const metadata: Metadata = {
  title: "Tiny Changes Case Study | Plistic",
  description:
    "How Plistic helped Tiny Changes build Tiny Changes Big Podcast, a youth mental health podcast for young people considering a career in music.",
};

const stats = [
  {
    icon: Mic2,
    value: "12",
    label: "guests including Lauren Mayberry of CHVRCHES",
  },
  {
    icon: ListChecks,
    value: "End to end",
    label: "storyboarding, scheduling, production, launch and socials",
  },
  {
    icon: Sprout,
    value: "First",
    label: "Scotland's first national youth mental health charity",
  },
];

const storySections = [
  {
    title: "The brief",
    paragraphs: [
      "Tiny Changes is Scotland's first national youth mental health charity - a small, fiercely youth-led organisation with a well-earned reputation for doing work that is both bold and genuinely useful. When they decided that a podcast was the right format to reach young people navigating the realities of a career in music, they came to us to help bring that vision to life.",
      "The concept was clear and compelling: honest conversations with artists and advocates about what the music industry actually looks and feels like from the inside, and how to protect your mental health while building a career in it. The audience was young people who needed something real - not polished or cautious, but genuine. Tiny Changes' instinct for what that meant was strong from the start.",
      "Our role was to develop that concept into a fully produced six-episode series, managing every stage of the project from initial storyboarding through to distribution and launch.",
    ],
  },
  {
    title: "The guests",
    paragraphs: [
      "Securing the right contributors for a podcast about mental health in the music industry required careful research and genuine relationship management.",
      "We identified and coordinated twelve guests across the six episodes: Alice Johnson, EYVE, Lucy Babe Hunte, Lloyd Luther, Bemz, Maya Kashif, Jocelyn Si, Mobo Agoro, Kirsteen Harvey, Katie Waissel, Dr George Musgrave, and Lauren Mayberry.",
      "George Musgrave is one of the UK's leading academic researchers into music, mental health, and the economics of the creative industries. Lauren Mayberry, lead vocalist of CHVRCHES, is one of Scotland's most internationally recognised musicians, known for her outspoken advocacy on the experience of women in the music industry.",
    ],
  },
  {
    title: "The production",
    paragraphs: [
      "We sourced and secured a host and a filming venue, both chosen because they suited the charity's ethos and the world the podcast was speaking to.",
      "We wrote all scripting and show notes across the series, produced 24 social media clips to support the launch, and coordinated the full release across all major platforms.",
      "The subject matter required care as well as craft. Conversations about mental health, the pressures of the creative industries, and the gap between how a career in music looks from the outside and how it feels from the inside need to be handled with honesty rather than caution. The production was shaped to allow that - in the preparation, in the room, and in the edit.",
    ],
  },
];

const results = [
  {
    value: "6",
    label: "episodes developed from concept through to launch.",
  },
  {
    value: "12",
    label: "artists, advocates and experts researched, briefed and coordinated.",
  },
  {
    value: "24",
    label: "social media clips produced to support the campaign.",
  },
  {
    value: "All",
    label: "major podcast platforms covered for the series release.",
  },
  {
    value: "Full",
    label: "project management across storyboarding, scheduling, scripting, production and distribution.",
  },
];

const services = [
  "Concept development",
  "Storyboarding",
  "Scripting",
  "Show notes",
  "Host sourcing",
  "Guest research and coordination",
  "Full project management",
  "Production",
  "Social content",
  "Multi-platform launch",
];

const clientQuote: string | null = null;

export default function TinyChangesCaseStudyPage() {
  return (
    <>
      <LaunchBanner />
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="case-study-title">
          <div className={`p-container ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <Link className={styles.backLink} href="/#work">
                <ArrowLeft aria-hidden="true" size={15} />
                Selected work
              </Link>
              <p className={styles.kicker}>Case study - end-to-end production</p>
              <h1 id="case-study-title">
                Tiny Changes <span>Big Podcast</span>
              </h1>
              <p className={styles.heroLead}>
                Tiny Changes had a clear and purposeful concept: a podcast that would give young people considering a
                career in the music industry an honest, human resource for looking after their mental health inside it.
                They brought the vision, the mission, and the relationships. We took care of everything else.
              </p>
              <div className={styles.heroActions}>
                <Link className="p-btn" href="/pricing">
                  Scope a podcast
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
                alt="Podcast production monitor during a recorded interview"
                fill
                priority
                sizes="(max-width: 900px) 100vw, 52vw"
              />
              <div className={styles.mediaCaption}>
                <div>
                  <strong>Tiny Changes</strong>
                  <span>National youth mental health charity</span>
                </div>
                <div
                  className={`${styles.logoBadge} ${styles.darkLogoBadge}`}
                  role="img"
                  aria-label="Tiny Changes"
                >
                  <Image
                    src="/assets/logos/tc-logo-v2-ilka-tc-donationlogo-wh.png"
                    alt=""
                    width={180}
                    height={80}
                    sizes="120px"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.statBand} aria-label="Tiny Changes case study statistics">
          <div className={`p-container ${styles.statGrid}`}>
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div className={styles.statCard} key={stat.value}>
                  <Icon aria-hidden="true" size={22} />
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className={`p-section ${styles.intro}`} aria-label="Case study opening">
          <div className="p-container">
            <p className={styles.introStatement}>
              A mental health podcast for young people in music needed <span>care as much as craft</span>.
            </p>
          </div>
        </section>

        <section className={`p-section ${styles.story}`} aria-labelledby="case-story-title">
          <div className={`p-container ${styles.storyGrid}`}>
            <div className={styles.sectionRail}>
              <p className="p-eyebrow">The build</p>
              <h2 id="case-story-title">From purposeful idea to full series launch.</h2>
            </div>
            <div className={styles.storyStack}>
              {storySections.map((section) => (
                <article className={styles.storyCard} key={section.title}>
                  <h3>{section.title}</h3>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={`p-section p-dark ${styles.results}`} aria-labelledby="case-results-title">
          <div className={`p-container ${styles.resultsGrid}`}>
            <div className={styles.sectionRail}>
              <p className="p-eyebrow">What we delivered</p>
              <h2 id="case-results-title">The whole production system.</h2>
            </div>
            <div className={styles.resultList}>
              {results.map((result) => (
                <div className={styles.resultCard} key={`${result.value}-${result.label}`}>
                  <strong>{result.value}</strong>
                  <span>{result.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`p-section ${styles.meaning}`} aria-labelledby="case-meaning-title">
          <div className={`p-container ${styles.meaningInner}`}>
            <div>
              <h2 id="case-meaning-title">
                Services <span>included</span>.
              </h2>
              <p>
                {services.join(" · ")}. Every element of the production was shaped around the charity's ethos and the
                audience it was made for.
              </p>
              <p>The series is available across all major podcast platforms.</p>
            </div>

            {clientQuote ? (
              <aside className={styles.quoteBlock}>
                <span className={styles.miniLabel}>Client quote</span>
                <p>{clientQuote}</p>
              </aside>
            ) : null}
          </div>
        </section>

        <section className={`p-section ${styles.cta}`} id="contact" aria-labelledby="case-cta-title">
          <div className={`p-container ${styles.ctaInner}`}>
            <div>
              <p className={styles.kicker}>Next step</p>
              <h2 id="case-cta-title">Make the sensitive thing useful.</h2>
              <p>
                Use the pricing tool for an instant range, or book a call and we will talk through the shape of the
                show.
              </p>
            </div>
            <div className={styles.ctaActions}>
              <Link className={`p-btn ${styles.whiteButton}`} href="/pricing">
                Get an estimate
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
