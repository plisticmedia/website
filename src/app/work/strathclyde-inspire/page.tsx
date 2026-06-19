import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, ChartNoAxesCombined, Mic2, Trophy } from "lucide-react";
import { Footer } from "@/components/Footer";
import { LaunchBanner } from "@/components/LaunchBanner";
import { SiteHeader } from "@/components/SiteHeader";
import styles from "../WorkCaseStudy.module.css";

export const metadata: Metadata = {
  title: "Strathclyde Inspire Case Study | Plistic",
  description:
    "How Plistic helped Strathclyde Inspire build the Inspiring Entrepreneurs Podcast across five years, 52 episodes, and a #1 Apple Podcasts niche ranking.",
};

const stats = [
  {
    icon: Trophy,
    value: "#1",
    label: "in Climate Action Entrepreneurs on Apple Podcasts",
  },
  {
    icon: ChartNoAxesCombined,
    value: "2x+",
    label: "audience growth in 2025/26 alone",
  },
  {
    icon: Mic2,
    value: "52",
    label: "episodes across 5 seasons",
  },
  {
    icon: CalendarDays,
    value: "5 years",
    label: "of partnership and counting",
  },
];

const storySections = [
  {
    title: "Who came to us and why",
    paragraphs: [
      "Strathclyde Inspire is the entrepreneurship centre for the University of Strathclyde - one of Scotland's leading universities and a significant force in the country's startup ecosystem. They work with students, staff, alumni, and the wider business community to support entrepreneurship at every stage.",
      "In 2021, they had a clear goal: to build a podcast that would carry the Inspiring Entrepreneurs name and serve their community. They had no previous podcasting experience, just a belief that this was the right thing to build and a willingness to build it properly.",
    ],
  },
  {
    title: "What they needed",
    paragraphs: [
      "What they needed was a production team that could grow with them - adapting to new directions, new formats, and new challenges as the show evolved, often at pace and against tight deadlines.",
      "Five years of content production is not a straight line. It requires a team that shows up consistently, responds quickly when things change, and keeps the quality high regardless of what else is shifting around the project.",
    ],
  },
  {
    title: "What we built together",
    paragraphs: [
      "Over five years we have iterated on almost every element of the show. Hosts have changed. Filming locations have moved. Episode formats have evolved as we learned what the audience responded to and what best served Inspire's goals.",
      "Each change came from a real conversation about what best served the audience and the organisation, and was backed up directly by data.",
      "We handle the complete production: recording, editing, post-production, and distribution. Beyond the podcast itself, we have worked with Strathclyde Inspire on their live events, and on projects spanning multiple internal and external stakeholders.",
    ],
  },
];

const results = [
  {
    value: "Top 50",
    label: "Consistently charting on Apple Podcasts for two years.",
  },
  {
    value: "#1",
    label: "Reached number one in Climate Action Entrepreneurs in 2026.",
  },
  {
    value: "#3",
    label: "Ranks third in Inspiring Entrepreneurs on Apple Podcasts.",
  },
  {
    value: "#4",
    label: "Ranks fourth in Start-Up Confidence on Apple Podcasts.",
  },
  {
    value: "2x+",
    label: "Audience more than doubled by the end of the 2025/26 season.",
  },
];

const clientQuote: string | null = null;

export default function StrathclydeInspireCaseStudyPage() {
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
              <p className={styles.kicker}>Case study - podcast production</p>
              <h1 id="case-study-title" className={`${styles.stackedTitle} ${styles.podcastTitle}`}>
                Inspiring <span>Entrepreneurs</span>
                <span className={styles.titleBaseLine}>Podcast</span>
              </h1>
              <p className={styles.heroLead}>
                Number one in their niche on Apple Podcasts. Audience more than doubled in a single year. Five years.
                Fifty-two episodes. That is where Strathclyde Inspire is now. In 2021, it was a blank slate.
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
                src="/assets/photos/strathclyde-inspire.jpg"
                alt="Strathclyde Inspire podcast production setup"
                fill
                priority
                sizes="(max-width: 900px) 100vw, 52vw"
              />
              <div className={styles.mediaCaption}>
                <div>
                  <strong>Strathclyde Inspire</strong>
                  <span>University entrepreneurship centre</span>
                </div>
                <div className={styles.logoBadge} role="img" aria-label="University of Strathclyde Inspire">
                  <Image
                    src="/assets/logos/18-1.png"
                    alt=""
                    width={160}
                    height={80}
                    sizes="120px"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.statBand} aria-label="Strathclyde Inspire case study statistics">
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
              A show at number one in its niche does not arrive that way. It is <span>built over time</span>.
            </p>
          </div>
        </section>

        <section className={`p-section ${styles.story}`} aria-labelledby="case-story-title">
          <div className={`p-container ${styles.storyGrid}`}>
            <div className={styles.sectionRail}>
              <p className="p-eyebrow">The brief</p>
              <h2 id="case-story-title">From blank slate to long-running show.</h2>
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
              <p className="p-eyebrow">The results</p>
              <h2 id="case-results-title">Five years of compounding value.</h2>
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
                What this means if you are considering a <span>podcast</span>.
              </h2>
              <p>
                A show at number one in its niche does not arrive that way. It is built - carefully, iteratively, over
                time - by a team that understands the medium and a client willing to trust the process. If you want a
                podcast that compounds in value rather than fades after the first season, this is what that looks like.
              </p>
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
              <h2 id="case-cta-title">Build a show that can grow.</h2>
              <p>Use the pricing tool for an instant range, or book a call and we will talk through the shape of the show.</p>
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
