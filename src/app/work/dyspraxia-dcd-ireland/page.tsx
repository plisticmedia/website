import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clapperboard, HeartHandshake, MapPin } from "lucide-react";
import { Footer } from "@/components/Footer";
import { LaunchBanner } from "@/components/LaunchBanner";
import { SiteHeader } from "@/components/SiteHeader";
import styles from "../WorkCaseStudy.module.css";

export const metadata: Metadata = {
  title: "Dyspraxia DCD Ireland Case Study | Plistic",
  description:
    "How Plistic Media produced a series of parent-education films for Dyspraxia DCD Ireland - everyday parent-and-child scenes for Signposts for managing challenging behaviour, filmed over two days with several families and built around a dyspraxia audience.",
};

const stats = [
  {
    icon: Clapperboard,
    value: "2 days",
    label: "on-location filming across home, a park and a shop",
  },
  {
    icon: HeartHandshake,
    value: "Families",
    label: "several families filmed at their own pace, parents present throughout",
  },
  {
    icon: MapPin,
    value: "Child-led",
    label: "a shoot built specifically for a dyspraxia audience",
  },
];

const storySections = [
  {
    title: "The brief",
    paragraphs: [
      "Dyspraxia DCD Ireland is the national charity supporting people with Dyspraxia / Developmental Coordination Disorder (DCD) and their families. For Signposts for managing challenging behaviour, a parent-education resource, they wanted a series of short films made for a dyspraxia audience.",
      "Each film is a short, everyday moment between a parent and child - getting ready in the morning, mealtimes, chores, homework, learning to pour a drink or use the washing machine, playing together - used to model positive, practical ways of handling everyday behaviour. The scenes stand alone, so families only ever had to focus on their own moment on the day.",
    ],
  },
  {
    title: "A shoot built for the children in it",
    paragraphs: [
      "Because the films feature real children, the whole production was designed around them. We filmed just one scene at a time, in short blocks of two or three with proper rest in between, so there was never a rush - and there was no pressure to be word-perfect, with the crew happy to run extra takes.",
      "The schedule was built for a dyspraxia audience specifically: extra time for scenes involving physical tasks, a predictable running order with clear signals before moving on, and settling-in time whenever filming moved to a new or unfamiliar location such as the park. If a child needed a longer break or more time to settle, the day had the flexibility built in.",
    ],
  },
  {
    title: "Planning and delivery",
    paragraphs: [
      "We handled the communication, planning and project management end to end - preparing the scripts and a clear shoot-order, coordinating several families across two filming days and three settings, and understanding the charity's vision from day one.",
      "Throughout, the priority was a calm, consent-led process that put the families first while still capturing the honest, human moments the resource needed - then delivering the finished films with professionalism, reliability and attention to detail.",
    ],
  },
];

const results = [
  {
    value: "2 days",
    label: "of on-location filming across home, a park and a shop.",
  },
  {
    value: "Series",
    label: "of standalone parent-and-child scenes produced for the resource.",
  },
  {
    value: "Child-led",
    label: "pace built for a dyspraxia audience, with extra time and proper breaks.",
  },
  {
    value: "End to end",
    label: "scripting, shoot-order, scheduling, project management and delivery.",
  },
];

const services = [
  "Concept and brief development",
  "Script and shoot-order preparation",
  "Location filming (home, park and shop)",
  "Working sensitively with children and families",
  "Child-centred scheduling for a dyspraxia audience",
  "Chaperone and compliance coordination (Protection of Young Persons Act / WRC licence)",
  "Direction",
  "Editing",
  "Delivery",
];

// Sharon Lane's full review, shown in the client quote block.
const clientQuoteParagraphs = [
  "We had the pleasure of working with Plistic Media to develop a parenting support programme, which included the production of a series of video snapshots featuring children with DCD and their families.",
  "From the outset, Ross and Andi demonstrated an exceptional ability to work with both the children and their parents. They created a warm, relaxed, and supportive environment that immediately put families at ease. Parents frequently commented on how comfortable and natural the entire filming process felt, which was especially important given the personal nature of the project.",
  "As an organisation, we found the communication, planning, and project management to be first class. Plistic Media understood our vision from day one and consistently delivered with professionalism, reliability, and attention to detail. They were proactive, responsive, and an absolute pleasure to work with throughout every stage of the project.",
  "What truly sets Plistic Media apart is the thoughtfulness and care they bring to their work. It is clear that they are deeply passionate about what they do, and that passion shines through in both the process and the final product. Their commitment to quality, combined with their genuine consideration for the people involved, made them a trusted partner and a dream to work with.",
  "We would wholeheartedly recommend Plistic Media to any organisation seeking a creative, professional, and compassionate media production team.",
];

export default function DyspraxiaDcdIrelandCaseStudyPage() {
  return (
    <>
      <LaunchBanner />
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="case-study-title">
          <div className={`p-container ${styles.heroStack} ${styles.heroCentered}`}>
            <div className={`${styles.heroMedia} ${styles.heroMediaVideo} p-vf`}>
              <span className="p-vfc" aria-hidden="true" />
              <video
                className={styles.heroVideo}
                src="/assets/video/dyspraxia-signposts.mp4"
                autoPlay
                muted
                playsInline
                preload="auto"
                aria-label="Signposts for managing challenging behaviour — title slide"
              />
            </div>

            <div className={styles.heroCopy}>
              <p className={styles.kicker}>Case study · Dyspraxia DCD Ireland</p>
              <h1 id="case-study-title" className={styles.stackedTitle}>
                Signposts <span>for managing challenging behaviour</span>
              </h1>
              <p className={styles.heroLead}>
                Dyspraxia DCD Ireland wanted a series of short parent-education films - everyday moments between a parent and
                child that model positive, practical ways to handle behaviour, made for a dyspraxia audience. We filmed
                several families over two days, at home, in a park and in a shop, in a shoot built entirely around the
                children in it.
              </p>
              <div className={styles.heroActions}>
                <Link className="p-btn" href="/pricing">
                  Scope a project
                  <ArrowRight aria-hidden="true" size={18} />
                </Link>
                <Link className={`p-btn ${styles.ghost}`} href="/book">
                  <CalendarDays aria-hidden="true" size={18} />
                  Book a call
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.statBand} aria-label="Dyspraxia DCD Ireland case study statistics">
          <div className={`p-container ${styles.statGrid} ${styles.statsCentered}`}>
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
              Filming children and families meant <span>earning trust before rolling a frame</span>.
            </p>
          </div>
        </section>

        <section className={`p-section ${styles.story}`} aria-labelledby="case-story-title">
          <div className={`p-container ${styles.storyGrid}`}>
            <div className={styles.sectionRail}>
              <p className="p-eyebrow">The build</p>
              <h2 id="case-story-title">From a personal brief to a finished series.</h2>
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
              <h2 id="case-results-title">A caring production, start to finish.</h2>
            </div>
            <div className={`${styles.resultList} ${styles.resultsCompact}`}>
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
          <div className={`p-container ${styles.meaningInner} ${styles.meaningStacked} ${styles.meaningCentered}`}>
            <div>
              <h2 id="case-meaning-title">
                Services <span>included</span>.
              </h2>
              <p>
                {services.join(" · ")}. Every part of the production was shaped around the families taking part and the
                parents the films were made for.
              </p>
            </div>

            <aside className={styles.quoteBlock}>
              <span className={styles.miniLabel}>Client quote</span>
              {clientQuoteParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <p className={styles.quoteAttribution}>Sharon Lane, Dyspraxia DCD Ireland</p>
            </aside>
          </div>
        </section>

        <section className={`p-section ${styles.cta}`} id="contact" aria-labelledby="case-cta-title">
          <div className={`p-container ${styles.ctaInner}`}>
            <div>
              <p className={styles.kicker}>Next step</p>
              <h2 id="case-cta-title">Have a sensitive story to tell?</h2>
              <p>
                Use the pricing tool for an instant range, or book a call and we will talk through how to film it with
                the care it deserves.
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
