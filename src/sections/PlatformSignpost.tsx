import Link from "next/link";
import { ArrowRight, Clapperboard, Compass, Sparkles } from "lucide-react";
import { bookingPagePath } from "@/data/site";
import styles from "./PlatformSignpost.module.css";

/**
 * Explains the whole of Plistic in one place: we make media ourselves, we run
 * Scotland's media directory, and we celebrate the scene with the showcase —
 * plus a low-pressure "not sure what you need?" route to a call.
 */
const pillars = [
  {
    icon: Clapperboard,
    title: "We make the media",
    text: "Our own Glasgow production studio — podcasts, video, documentary, ads and strategy, made with you end to end.",
    href: "/#services",
    cta: "See what we make",
  },
  {
    icon: Compass,
    title: "The Media Directory",
    text: "Find and hire Scotland's creative and media businesses — filter by service and place, see them on the map, enquire direct.",
    href: "/directory",
    cta: "Browse the directory",
  },
  {
    icon: Sparkles,
    title: "Scotland's Showcase",
    text: "The best of Scotland's creative scene — standout work, films, events and stories worth celebrating. Submit your own to feature.",
    href: "/showcase",
    cta: "Explore the showcase",
  },
];

export function PlatformSignpost() {
  return (
    <section className={`p-section ${styles.section}`} aria-labelledby="platform-title">
      <div className="p-container">
        <div className={styles.head}>
          <p className="p-eyebrow">One company, three ways in</p>
          <h2 id="platform-title" className={`p-h2 ${styles.title}`}>
            Plistic makes media — and is building its <span className="azu">home in Scotland</span>.
          </h2>
          <p className={`p-lead ${styles.lead}`}>
            We&apos;re a production studio, a directory for finding creative talent, and a showcase celebrating the
            country&apos;s best work — all under one roof.
          </p>
        </div>

        <div className={styles.grid}>
          {pillars.map((p) => (
            <Link href={p.href} className={`${styles.card} p-vf`} key={p.title}>
              <span className="p-vfc" aria-hidden="true" />
              <span className={styles.icon} aria-hidden="true"><p.icon size={24} /></span>
              <h3 className={styles.cardTitle}>{p.title}</h3>
              <p className={styles.cardText}>{p.text}</p>
              <span className={styles.link}>
                {p.cta} <ArrowRight aria-hidden="true" size={16} />
              </span>
            </Link>
          ))}
        </div>

        <div className={styles.helper}>
          <p className={styles.helperText}>
            <strong>Not sure what you need?</strong> Book a call and we&apos;ll help you work it out — no pressure, no jargon.
          </p>
          <Link href={bookingPagePath} className={styles.helperBtn}>
            Book a call <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
