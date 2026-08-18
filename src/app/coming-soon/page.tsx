import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Compass, Store } from "lucide-react";
import { brand, bookingUrl } from "@/data/site";
import { BetaSignupForm } from "./BetaSignupForm";

export const metadata: Metadata = {
  title: "Coming Soon | Plistic",
  description: "Plistic is getting ready to launch.",
  robots: {
    follow: false,
    index: false,
  },
};

export default function ComingSoonPage() {
  return (
    <main className="coming-soon-page">
      <section className="coming-soon-hero" aria-labelledby="coming-soon-heading">
        <div className="coming-soon-shell">
          <div className="coming-soon-brand">
            <Image
              alt="Plistic Media"
              height={78}
              priority
              src="/assets/brand/plistic-media.png"
              width={170}
            />
          </div>
          <p className="coming-soon-kicker">Glasgow &middot; Made in Scotland</p>
          <h1 id="coming-soon-heading">
            <span className="coming-soon-line coming-soon-line-white">
              <span>We&apos;re</span> <span>getting</span>
            </span>
            <span className="coming-soon-line coming-soon-line-accent">
              <span>ready to</span> <span>launch</span>
            </span>
          </h1>
          <a className="coming-soon-enter" href="/api/enter-site">
            Continue to our website
            <ArrowUpRight aria-hidden="true" size={20} />
          </a>
          <p className="coming-soon-copy">
            <strong>Scotland&apos;s Media Directory</strong>{" "}is almost here — a place to find and hire the country&apos;s
            creative and media businesses (film &amp; TV, music, games, design, PR, photography and more), compare
            them by service and price, and enquire or book directly. It&apos;s free to be listed.
          </p>
          <div className="coming-soon-actions">
            <Link className="button button-primary" href="/list-your-business">
              <Store aria-hidden="true" size={18} />
              List your business
            </Link>
            <a className="button button-secondary dark" href={bookingUrl}>
              <CalendarDays aria-hidden="true" size={17} />
              {brand.bookingLabel}
            </a>
          </div>

          <div className="coming-soon-beta">
            <p className="coming-soon-beta-kicker">
              <Compass aria-hidden="true" size={16} /> Want early access?
            </p>
            <h2>Become a beta tester</h2>
            <p className="coming-soon-beta-copy">
              Get in before everyone else, claim and customise your page, and help shape the directory. We&apos;ll
              email you the access password and how to share feedback.
            </p>
            <BetaSignupForm />
          </div>
        </div>
      </section>
    </main>
  );
}
