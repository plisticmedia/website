import Link from "next/link";
import { ArrowRight, Clapperboard, Receipt } from "lucide-react";
import { bookingPagePath } from "@/data/site";
import styles from "./PlatformSignpost.module.css";

/**
 * Public-facing homepage signpost (shown to everyone who is not an admin or
 * beta tester): an enquiry-led studio — see what we make, get an instant
 * estimate, then book a call. Admins/beta testers see <PlatformSignpost />.
 */
const pillars = [
  {
    icon: Clapperboard,
    title: "We make the media",
    text: "Our own Glasgow production studio — podcasts, video, documentary, ads and strategy, made with you end to end.",
    href: "#services",
    cta: "See what we make",
  },
  {
    icon: Receipt,
    title: "Get an estimate",
    text: "See a ballpark price for your project in about a minute, then book a call to talk it through — no pressure, no jargon.",
    href: "/pricing",
    cta: "Get an instant estimate",
  },
];

export function EnquirySignpost() {
  return (
    <section className={`p-section ${styles.section}`} aria-labelledby="platform-title">
      <div className="p-container">
        <div className={styles.head}>
          <p className="p-eyebrow">One studio, made simple</p>
          <h2 id="platform-title" className={`p-h2 ${styles.title}`}>
            Plistic makes media — <span className="azu">let&apos;s make yours</span>.
          </h2>
          <p className={`p-lead ${styles.lead}`}>
            We&apos;re a Glasgow production studio you can hire end to end. Get an instant estimate, then talk it through
            with us.
          </p>
        </div>

        <div className={`${styles.grid} ${styles.gridTwo}`}>
          {pillars.map((p) => {
            const inner = (
              <>
                <span className="p-vfc" aria-hidden="true" />
                <span className={styles.icon} aria-hidden="true"><p.icon size={24} /></span>
                <h3 className={styles.cardTitle}>{p.title}</h3>
                <p className={styles.cardText}>{p.text}</p>
                <span className={styles.link}>
                  {p.cta} <ArrowRight aria-hidden="true" size={16} />
                </span>
              </>
            );
            // Same-page anchors (e.g. #services) use a native <a> so the browser
            // reliably scrolls to the section; real routes use Next's <Link>.
            return p.href.startsWith("#") ? (
              <a href={p.href} className={`${styles.card} p-vf`} key={p.title}>
                {inner}
              </a>
            ) : (
              <Link href={p.href} className={`${styles.card} p-vf`} key={p.title}>
                {inner}
              </Link>
            );
          })}
        </div>

        <div className={styles.helper}>
          <p className={styles.helperText}>
            <strong>Not sure what you need?</strong>{" "}
            Book a call and we&apos;ll help you work it out — no pressure, no jargon.
          </p>
          <Link href={bookingPagePath} className={styles.helperBtn}>
            Book a call <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
