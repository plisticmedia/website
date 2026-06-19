import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { bookingPagePath } from "@/data/site";
import styles from "./ClosingCTA.module.css";

export function ClosingCTA() {
  return (
    <section className={`p-section ${styles.closing}`} id="contact" aria-labelledby="contact-title">
      <div className={`p-container ${styles.inner}`}>
        <p className={styles.eyebrow}>Let&apos;s talk</p>
        <h2 id="contact-title" className={styles.h}>
          Bring the idea. We&apos;ll build the media around it.
        </h2>
        <p className={styles.sub}>
          Start with a quote or book a 30-minute call.
        </p>
        <div className={styles.actions}>
          <Link className={`p-btn ${styles.btnWhite}`} href="/pricing">
            Get a Quote
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
          <Link className={`p-btn ${styles.btnOutline}`} href={bookingPagePath}>
            <CalendarDays aria-hidden="true" size={18} />
            Book a Call
          </Link>
        </div>
      </div>
    </section>
  );
}
