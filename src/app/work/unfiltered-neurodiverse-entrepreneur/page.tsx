import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Accessibility, ArrowRight, CalendarDays, Film, Microscope } from "lucide-react";
import { Footer } from "@/components/Footer";
import { LaunchBanner } from "@/components/LaunchBanner";
import { SiteHeader } from "@/components/SiteHeader";
import styles from "../WorkCaseStudy.module.css";

export const metadata: Metadata = {
  title: "Unfiltered Case Study | Plistic",
  description:
    "How Plistic produced Unfiltered: Life as a Neurodiverse Entrepreneur, a UKRI ESRC-funded feature documentary commissioned from academic research.",
};

const stats = [
  {
    icon: Film,
    value: "Feature",
    label: "length documentary produced from academic research",
  },
  {
    icon: Microscope,
    value: "UKRI ESRC",
    label: "funded research commission",
  },
  {
    icon: Accessibility,
    value: "Access",
    label: "full accessibility coordination throughout production",
  },
  {
    icon: CalendarDays,
    value: "March 2026",
    label: "screened publicly and remains available online",
  },
];

const storySections = [
  {
    title: "The commission",
    paragraphs: [
      "Unfiltered: Life as a Neurodiverse Entrepreneur was commissioned by the University of Strathclyde Business School, in partnership with Strathclyde Inspire and the Neurodiversity and Entrepreneurship Association, with funding from the UKRI Economic and Social Research Council.",
      "The research had produced substantive findings on the experience of neurodiverse entrepreneurs - the structural barriers they face, the ways they think and work differently, and what the business and academic ecosystem frequently gets wrong about them.",
      "The research partners wanted a film that would carry those findings beyond academic journals and into the wider world.",
    ],
  },
  {
    title: "From research to story",
    paragraphs: [
      "Arriving to Plistic with a clear purpose and a specific budget, the first stage of the project was storyboarding - working through how to represent the research in a human-centred documentary format.",
      "Academic findings are structured around evidence and argument. A film is structured around people and moments. We worked out which subjects would illuminate which themes, how the narrative should move across the film, and what shape would allow the ideas to land for an audience encountering them for the first time.",
      "We sourced every subject in the documentary through collective networks. Rather than being given a list of contributors, we identified people whose experiences illuminated the themes of the research, made contact, and conducted pre-screening interviews before any filming began.",
      "This process was paramount because the subject matter was personal, the conversations required trust, and the documentary needed a range of perspectives that together made the research feel fully human.",
    ],
  },
  {
    title: "Accessibility as a production value",
    paragraphs: [
      "Every contributor in this film had accessibility requirements of some kind - which, given the subject matter, was both expected and significant.",
      "Coordinating a production around those requirements was not incidental to the work; it was central to it. Scheduling, location, environment, pacing, and the structure of each filming session were all shaped around what would allow each person to engage on their own terms and present their most authentic self on screen.",
      "A production that is documenting the experience of neurodivergent people needs to embody the values it is describing. We took that seriously throughout.",
    ],
  },
  {
    title: "The result",
    paragraphs: [
      "Unfiltered: Life as a Neurodiverse Entrepreneur deals directly and honestly with the real experiences of neurodiverse entrepreneurs - the isolation, the misunderstanding, the structural disadvantages, and the genuine strengths that neurodivergent thinking brings to the world of building something new.",
      "It does not flinch from any of it and it does not reduce any of its subjects to their diagnosis.",
      "The film was screened in March 2026 and remains available online.",
    ],
  },
];

const results = [
  {
    value: "Research",
    label: "findings translated from academic evidence into a human-centred film structure.",
  },
  {
    value: "Subjects",
    label: "sourced, contacted and pre-screened through collective networks before filming.",
  },
  {
    value: "Access",
    label: "requirements coordinated across scheduling, locations, environments, pacing and sessions.",
  },
  {
    value: "Feature",
    label: "length documentary produced from initial story structure through to final film.",
  },
  {
    value: "Online",
    label: "screened in March 2026 and remains available for audiences to discover.",
  },
];

const services = [
  "Concept development",
  "Storyboarding",
  "Subject sourcing and pre-screening",
  "Accessibility coordination",
  "Full documentary production",
];

const clientQuote: { text: string; attribution: string } | null = null;

export default function UnfilteredCaseStudyPage() {
  return (
    <>
      <LaunchBanner />
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="case-study-title">
          <div className={`p-container ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>Case study - feature documentary</p>
              <h1 id="case-study-title" className={styles.stackedTitle}>
                Unfiltered <span>Life as a Neurodiverse Entrepreneur</span>
              </h1>
              <p className={styles.heroLead}>
                Commissioned by the University of Strathclyde Business School with Strathclyde Inspire and the
                Neurodiversity and Entrepreneurship Association, this UKRI ESRC-funded documentary brought academic
                research on neurodiverse entrepreneurship to a wider audience.
              </p>
              <div className={styles.heroActions}>
                <Link className="p-btn" href="/pricing">
                  Scope a documentary
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
                src="/assets/photos/documentary-interview.webp"
                alt="Documentary interview setup for Unfiltered"
                fill
                priority
                sizes="(max-width: 900px) 100vw, 52vw"
                style={{ objectPosition: "58% center" }}
              />
              <div className={styles.mediaCaption}>
                <div>
                  <strong>Unfiltered</strong>
                  <span>Research-led documentary</span>
                </div>
                <div className={styles.logoBadge} role="img" aria-label="University of Strathclyde Business School">
                  <Image
                    src="/assets/logos/strath-business-removebg-preview.png"
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

        <section className={styles.statBand} aria-label="Unfiltered case study statistics">
          <div className={`p-container ${styles.statGrid} ${styles.narrativeStatGrid}`}>
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
              Research tells you what is true. Documentary film makes an audience <span>feel it</span>.
            </p>
          </div>
        </section>

        <section className={`p-section ${styles.story}`} aria-labelledby="case-story-title">
          <div className={`p-container ${styles.storyGrid}`}>
            <div className={styles.sectionRail}>
              <p className="p-eyebrow">The commission</p>
              <h2 id="case-story-title">Academic research, made human.</h2>
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
              <p className="p-eyebrow">What we built</p>
              <h2 id="case-results-title">A film built around care and clarity.</h2>
            </div>
            <div className={`${styles.resultList} ${styles.narrativeResultList}`}>
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
                {services.join(" - ")}. The film was developed from the ground up, with story structure,
                contributor sourcing and accessibility coordination treated as core production work.
              </p>
              <p>
                The result is a feature documentary that carries the research honestly while keeping the people at the
                centre of it fully human on screen.
              </p>
            </div>

            {clientQuote ? (
              <aside className={styles.quoteBlock}>
                <span className={styles.miniLabel}>Client quote</span>
                <p>{clientQuote.text}</p>
                <p className={styles.quoteAttribution}>{clientQuote.attribution}</p>
              </aside>
            ) : null}
          </div>
        </section>

        <section className={`p-section ${styles.cta}`} id="contact" aria-labelledby="case-cta-title">
          <div className={`p-container ${styles.ctaInner}`}>
            <div>
              <p className={styles.kicker}>Next step</p>
              <h2 id="case-cta-title">Make research felt.</h2>
              <p>
                Use the pricing tool for an instant range, or book a call and we will talk through how documentary can
                carry complex work to a wider audience.
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
