import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Film, RefreshCw, School, Scissors } from "lucide-react";
import { Footer } from "@/components/Footer";
import { LaunchBanner } from "@/components/LaunchBanner";
import { SiteHeader } from "@/components/SiteHeader";
import styles from "../WorkCaseStudy.module.css";

export const metadata: Metadata = {
  title: "Connect-Ed Network Case Study | Plistic",
  description:
    "How Plistic helped Connect-Ed turn eight live EiR events into an evergreen podcast series, social clips, and multi-platform content for Scotland's university entrepreneurship network.",
};

const stats = [
  {
    icon: Film,
    value: "200h to 8",
    label: "hours of raw footage shaped into 8 polished episodes",
  },
  {
    icon: Scissors,
    value: "32",
    label: "social clips produced for the series",
  },
  {
    icon: School,
    value: "5+",
    label: "Scottish universities using the content as a resource",
  },
  {
    icon: RefreshCw,
    value: "Evergreen",
    label: "still discoverable across podcast platforms, YouTube and Community Lab",
  },
];

const storySections = [
  {
    title: "The project",
    paragraphs: [
      "Connect-Ed is the Entrepreneur in Residence network for Scotland's universities and colleges - a platform that connects experienced practitioners, mentors, visiting professors, and commercial champions with academic institutions.",
      "The network includes the University of Edinburgh, University of Strathclyde, Edinburgh Napier, University of Stirling, the University of the West of Scotland, and organisations including the Scottish Government, the Scottish Funding Council, Converge Challenge, and Research and Innovation Scotland.",
      "Between January and May 2025, Connect-Ed ran eight live events bringing together entrepreneurs, practitioners, and academic professionals around the theme of entrepreneurship in higher education.",
    ],
  },
  {
    title: "The ambition",
    paragraphs: [
      "The ambition from the start was to produce something that would last - content that would serve the Connect-Ed community long after each event had ended, be useful to institutions across the network, and remain discoverable and relevant for years to come.",
      "The conversations happening in those rooms had real value. The challenge was making sure that value reached beyond the rooms it happened in.",
    ],
  },
  {
    title: "The production approach",
    paragraphs: [
      "We worked alongside the Connect-Ed team across all eight events, building our production approach around the reality of the people involved rather than a fixed template.",
      "Some conversations were captured on the day. Others were scheduled as follow-up interviews in the days or weeks after - in person or remotely - depending on what suited each host and guest and what the content of that particular event called for.",
      "Working with academics, senior practitioners, and institutional figures with demanding schedules and specific contexts requires flexibility and responsiveness, and that shaped how we approached every stage of this project.",
    ],
  },
  {
    title: "Where it lives",
    paragraphs: [
      "The series is available on all major podcast platforms, on YouTube, and within Connect-Ed's community space on the Community Lab platform.",
      "It is used by universities and colleges across Scotland as an educational and professional development resource and continues to be actively discovered across all platforms.",
      "The content was built to last, and it has.",
    ],
  },
];

const results = [
  {
    value: "8",
    label: "live events captured between January and May 2025.",
  },
  {
    value: "200h",
    label: "of event footage, panel discussions, keynotes and interviews reviewed and shaped.",
  },
  {
    value: "8",
    label: "episodes produced, ranging from 28 to 65 minutes in length.",
  },
  {
    value: "32",
    label: "social media clips produced to extend the series across platforms.",
  },
  {
    value: "All",
    label: "major podcast platforms, YouTube and Community Lab covered for distribution.",
  },
];

const services = [
  "Event filming",
  "Interview production",
  "Series editing",
  "Social content",
  "Multi-platform distribution",
];

const clientQuote = {
  text: "It's been an utter delight working with you and particularly being guided by your experience and expertise. Thank you for all that you have done.",
  attribution: "Ross Tuffee, Connect-Ed Network",
};

export default function ConnectEdNetworkCaseStudyPage() {
  return (
    <>
      <LaunchBanner />
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="case-study-title">
          <div className={`p-container ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>Case study - event capture and series production</p>
              <h1 id="case-study-title">
                The EiR <span>Podcast Series</span>
              </h1>
              <p className={styles.heroLead}>
                Connect-Ed ran eight live events bringing together practitioners, academics, and institutional leaders
                around entrepreneurship in higher education. We helped turn the value in those rooms into an evergreen
                podcast series, social clips, and a resource still being discovered across platforms. EiR stands for
                Entrepreneur in Residence: the practitioners embedded across Scotland&apos;s universities and colleges.
              </p>
              <div className={styles.heroActions}>
                <Link className="p-btn" href="/pricing">
                  Scope event content
                  <ArrowRight aria-hidden="true" size={18} />
                </Link>
                <Link className={`p-btn ${styles.ghost}`} href="/book">
                  <CalendarDays aria-hidden="true" size={18} />
                  Book a call
                </Link>
              </div>
            </div>

            <div className={`${styles.heroMedia} ${styles.connectHeroMedia} p-vf`}>
              <span className="p-vfc" aria-hidden="true" />
              <Image
                src="/assets/photos/site/connect-ed-2.jpg"
                alt="Connect-Ed podcast series production artwork"
                fill
                priority
                sizes="(max-width: 900px) 100vw, 52vw"
                style={{ objectFit: "cover", objectPosition: "56% center" }}
              />
              <div className={styles.mediaCaption}>
                <div>
                  <strong>Connect-Ed Network</strong>
                  <span>Entrepreneur in Residence network</span>
                </div>
                <div className={styles.logoBadge} role="img" aria-label="Connect-Ed Podcast">
                  <Image
                    src="/assets/logos/connect-ed-podcast-art-removebg-preview-1.png"
                    alt=""
                    width={180}
                    height={180}
                    sizes="120px"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.statBand} aria-label="Connect-Ed case study statistics">
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
              Eight live events became a <span>resource that outlasted the room</span>.
            </p>
          </div>
        </section>

        <section className={`p-section ${styles.story}`} aria-labelledby="case-story-title">
          <div className={`p-container ${styles.storyGrid}`}>
            <div className={styles.sectionRail}>
              <p className="p-eyebrow">The project</p>
              <h2 id="case-story-title">Flexible capture for a live network.</h2>
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
              <h2 id="case-results-title">From raw event archive to evergreen series.</h2>
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
                {services.join(" · ")}. The goal was not simply to record events, but to turn them into a series that
                institutions could keep using.
              </p>
              <p>
                The result is educational and professional development content that continues to live across podcast
                platforms, YouTube and the Connect-Ed community space.
              </p>
            </div>

            <aside className={styles.quoteBlock}>
              <span className={styles.miniLabel}>What Ross said</span>
              <p>{clientQuote.text}</p>
              <p className={styles.quoteAttribution}>{clientQuote.attribution}</p>
            </aside>
          </div>
        </section>

        <section className={`p-section ${styles.cta}`} id="contact" aria-labelledby="case-cta-title">
          <div className={`p-container ${styles.ctaInner}`}>
            <div>
              <p className={styles.kicker}>Next step</p>
              <h2 id="case-cta-title">Turn live moments into lasting assets.</h2>
              <p>
                Use the pricing tool for an instant range, or book a call and we will talk through what your event
                content could become.
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
