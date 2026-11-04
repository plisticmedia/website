import Link from "next/link";
import { ArrowRight, Clapperboard, ShoppingBag, Store } from "lucide-react";
import { bookingPagePath } from "@/data/site";
import styles from "./PlatformSignpost.module.css";

/**
 * Explains Plistic in one place: we make media ourselves, and you can buy our
 * packages, items and services directly — plus a low-pressure "not sure what
 * you need?" route to a call.
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
    icon: ShoppingBag,
    title: "Buy from us",
    text: "Shop Plistic Media's packages, items and services directly — pick what you need and check out online.",
    href: "/marketplace",
    cta: "Visit the shop",
  },
  {
    icon: Store,
    title: "Our profile",
    text: "See Plistic Media's full profile — our packages, work, items for sale and client reviews, all in one place.",
    href: "/directory/plistic-media",
    cta: "See our profile",
  },
];

export function PlatformSignpost() {
  return (
    <section className={`p-section ${styles.section}`} aria-labelledby="platform-title">
      <div className="p-container">
        <div className={styles.head}>
          <p className="p-eyebrow">One studio, everything you need</p>
          <h2 id="platform-title" className={`p-h2 ${styles.title}`}>
            Plistic makes media — and makes it <span className="azu">easy to buy</span>.
          </h2>
          <p className={`p-lead ${styles.lead}`}>
            We&apos;re a Glasgow production studio you can hire end to end, or shop directly for packages, items and
            services — all under one roof.
          </p>
        </div>

        <div className={styles.grid}>
          {pillars.map((p) => {
            return (
              <Link href={p.href} className={`${styles.card} p-vf`} key={p.title}>
                <span className="p-vfc" aria-hidden="true" />
                <span className={styles.icon} aria-hidden="true"><p.icon size={24} /></span>
                <h3 className={styles.cardTitle}>{p.title}</h3>
                <p className={styles.cardText}>{p.text}</p>
                <span className={styles.link}>
                  {p.cta} <ArrowRight aria-hidden="true" size={16} />
                </span>
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
