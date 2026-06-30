import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { brand, calendlyBookingUrl } from "@/data/site";

type ComingSoonPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
  }>;
};

export const metadata: Metadata = {
  title: "Coming Soon | Plistic",
  description: "Plistic is getting ready to launch.",
  robots: {
    follow: false,
    index: false,
  },
};

export default async function ComingSoonPage({ searchParams }: ComingSoonPageProps) {
  const params = await searchParams;
  const hasError = params?.error === "1";
  const nextPath = getSafeNextPath(params?.next);

  return (
    <main className="coming-soon-page">
      <details className="coming-soon-login">
        <summary>Login</summary>
        <form action="/api/site-access" method="post">
          <input type="hidden" name="next" value={nextPath} />
          <label htmlFor="site-access-password">Password</label>
          <input
            autoComplete="current-password"
            id="site-access-password"
            name="password"
            placeholder="Enter password"
            required
            type="password"
          />
          <button type="submit">Enter site</button>
          {hasError ? <p role="alert">That password did not work.</p> : null}
        </form>
      </details>

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
          <p className="coming-soon-copy">
            Plistic is almost ready. We&apos;re polishing the new home for podcasts, video, documentary,
            ads, music videos, and strategy.
          </p>
          <div className="coming-soon-actions">
            <a className="button button-primary" href={calendlyBookingUrl}>
              <CalendarDays aria-hidden="true" size={18} />
              {brand.bookingLabel}
            </a>
            <a className="button button-secondary dark" href={`mailto:${brand.email}`}>
              Email us
              <ArrowUpRight aria-hidden="true" size={17} />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

function getSafeNextPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}
