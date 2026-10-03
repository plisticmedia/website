import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clapperboard, HeartHandshake, MapPin } from "lucide-react";
import { Footer } from "@/components/Footer";
import { LaunchBanner } from "@/components/LaunchBanner";
import { SiteHeader } from "@/components/SiteHeader";
import styles from "../WorkCaseStudy.module.css";

export const metadata: Metadata = {
  title: "Dyspraxia DCD Ireland Case Study | Plistic",
  description:
    "How Plistic Media produced a series of video snapshots for Dyspraxia DCD Ireland's parenting support programme, filming children with DCD and their families with care and sensitivity.",
};

const stats = [
  {
    icon: Clapperboard,
    value: "Series",
    label: "of video snapshots for the parenting support programme",
  },
  {
    icon: HeartHandshake,
    value: "Families",
    label: "children with DCD and their parents, filmed with care",
  },
  {
    icon: MapPin,
    value: "On location",
    label: "filmed across multiple days in Ireland",
  },
];

const storySections = [
  {
    title: "The brief",
    paragraphs: [
      "Dyspraxia DCD Ireland is the national charity supporting people with Dyspraxia / Developmental Coordination Disorder (DCD) and their families across Ireland. As part of a new parenting support programme, they wanted a series of video snapshots featuring children with DCD and their families - a warm, honest resource that would help other parents feel seen, informed and less alone.",
      "The subject was personal. The films would feature real children and real families talking openly about their everyday lives, so the whole project had to be built on trust. Dyspraxia DCD Ireland came to us to turn that vision into a finished series, and to do it in a way that protected and respected the families taking part.",
    ],
  },
  {
    title: "The approach",
    paragraphs: [
      "From the outset, Ross and Andi set out to create a warm, relaxed and supportive environment - one where children and parents could feel at ease in front of the camera. Given the personal nature of the project, that comfort mattered as much as the finished footage.",
      "Families frequently commented on how natural and comfortable the entire filming process felt. That is not an accident: it comes from preparation, patience, and leading the day around the people in the room rather than around the schedule.",
    ],
  },
  {
    title: "The production",
    paragraphs: [
      "We handled the communication, planning and project management end to end - understanding the charity's vision from day one and delivering against it with professionalism, reliability and attention to detail.",
      "Filming took place on location in Ireland across multiple days, coordinated closely with the organisation and the families involved. Throughout, the priority was a calm, consent-led process that put the families first while still capturing the honest, human moments the programme needed.",
    ],
  },
];

const results = [
  {
    value: "Series",
    label: "of video snapshots produced for the parenting support programme.",
  },
  {
    value: "Families",
    label: "children with DCD and their parents supported through a calm, consent-led shoot.",
  },
  {
    value: "On location",
    label: "multi-day filming coordinated in Ireland.",
  },
  {
    value: "End to end",
    label: "communication, planning and project management across the project.",
  },
  {
    value: "Full",
    label: "production and delivery, handled with care for a sensitive subject.",
  },
];

const services = [
  "Concept and brief development",
  "Location filming",
  "Working sensitively with children and families",
  "Direction for a personal subject",
  "Communication and planning",
  "Full project management",
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
          <div className={`p-container ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>Case study - sensitive location production</p>
              <h1 id="case-study-title">
                Dyspraxia DCD Ireland <span>parenting support films</span>
              </h1>
              <p className={styles.heroLead}>
                Dyspraxia DCD Ireland wanted a series of video snapshots featuring children with DCD and their families
                for a new parenting support programme. The subject was personal, so the work had to be built on trust.
                They brought the vision and the families. We created the calm, caring environment that let their story be
                told.
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

            <div className={`${styles.heroMedia} p-vf`}>
              <span className="p-vfc" aria-hidden="true" />
              <Image
                src="/assets/photos/site/documentary-1.jpg"
                alt="On-location video production for a sensitive documentary project"
                fill
                priority
                sizes="(max-width: 900px) 100vw, 52vw"
              />
              <div className={styles.mediaCaption}>
                <div>
                  <strong>Dyspraxia DCD Ireland</strong>
                  <span>National Dyspraxia / DCD charity</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.statBand} aria-label="Dyspraxia DCD Ireland case study statistics">
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
