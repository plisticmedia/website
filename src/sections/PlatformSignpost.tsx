import Link from "next/link";
import { ArrowRight, Compass, Sparkles } from "lucide-react";
import styles from "./PlatformSignpost.module.css";

/**
 * Homepage bridge from the agency story to the platform: introduces the two
 * things a first-time visitor might otherwise miss — the media directory and
 * the Best-of-Scotland showcase — each with a clear way in.
 */
export function PlatformSignpost() {
  return (
    <section className={`p-section ${styles.section}`} aria-labelledby="platform-title">
      <div className="p-container">
        <div className={styles.head}>
          <p className="p-eyebrow">More than a studio</p>
          <h2 id="platform-title" className={`p-h2 ${styles.title}`}>
            Plistic is also Scotland&apos;s <span className="azu">media platform</span>.
          </h2>
          <p className={`p-lead ${styles.lead}`}>
            Beyond our own productions, we&apos;re building the home for the whole sector — a place to find
            people and to celebrate the best work coming out of Scotland.
          </p>
        </div>

        <div className={styles.grid}>
          <Link href="/directory" className={`${styles.card} p-vf`}>
            <span className="p-vfc" aria-hidden="true" />
            <span className={styles.icon} aria-hidden="true"><Compass size={24} /></span>
            <h3 className={styles.cardTitle}>The Media Directory</h3>
            <p className={styles.cardText}>
              Browse Scotland&apos;s creative and media businesses — filter by service and place, see them on the
              map, and enquire directly.
            </p>
            <span className={styles.link}>
              Browse the directory <ArrowRight aria-hidden="true" size={16} />
            </span>
          </Link>

          <Link href="/showcase" className={`${styles.card} p-vf`}>
            <span className="p-vfc" aria-hidden="true" />
            <span className={styles.icon} aria-hidden="true"><Sparkles size={24} /></span>
            <h3 className={styles.cardTitle}>The Showcase</h3>
            <p className={styles.cardText}>
              The best of Scotland&apos;s creative scene — standout work, films, events and stories worth
              celebrating. Submit your own to be featured.
            </p>
            <span className={styles.link}>
              Explore the showcase <ArrowRight aria-hidden="true" size={16} />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
