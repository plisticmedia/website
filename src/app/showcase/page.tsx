import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { GoogleRating } from "@/components/GoogleRating";
import { getShowcaseServices } from "@/lib/services";
import { toDisplayImage, initialOf } from "@/lib/images";
import { LogoImage } from "../directory/ListingImage";
import styles from "../directory/Directory.module.css";

export const metadata: Metadata = {
  title: "Scotland's creative talent — showcase | Plistic",
  description: "A curated showcase of verified and founding creative and media businesses across Scotland.",
};

export const dynamic = "force-dynamic";

export default async function ShowcasePage() {
  const services = await getShowcaseServices();

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className="p-container">
            <p className={styles.kicker}>Showcase</p>
            <h1>
              Scotland&apos;s <span>creative talent</span>.
            </h1>
            <p className={styles.lead}>
              A curated selection of verified and founding partners across film, music, design, PR, audio and more.
            </p>
            <p style={{ marginTop: "1rem" }}>
              <Link href="/directory" style={{ color: "var(--p-white)", fontWeight: 600 }}>
                Browse the full directory →
              </Link>
            </p>
          </div>
        </section>

        <section className={`p-container ${styles.body}`}>
          {services.length === 0 ? (
            <p className={styles.empty}>The showcase is being curated — check back soon.</p>
          ) : (
            <ul className={styles.grid}>
              {services.map((s) => {
                const cardImg = toDisplayImage(s.logo_url) ?? toDisplayImage(s.cover_image_url);
                const tags = s.listing_services.map((ls) => ls.categories?.name).filter((n): n is string => !!n);
                const display = tags.length ? tags : s.categories?.name ? [s.categories.name] : [];
                return (
                  <li key={s.id}>
                    <Link href={`/directory/${s.slug}`} className={`${styles.card} ${s.is_featured ? styles.cardFeatured : ""}`}>
                      <div className={styles.cardImage}>
                        <LogoImage src={cardImg} alt={`${s.title} logo`} initial={initialOf(s.title)} initialClassName={styles.cardImageInitial} />
                      </div>
                      <div className={styles.cardBody}>
                        {display.length > 0 && <span className={styles.cardCat}>{display.slice(0, 3).join(" · ")}</span>}
                        <h2>{s.title}</h2>
                        <span className={styles.cardBadges}>
                          {s.founding && <span className={styles.cardFounding}>Founding partner</span>}
                          {s.verified && <span className={styles.cardVerified}>Verified</span>}
                        </span>
                        {s.google_rating != null && (
                          <GoogleRating rating={s.google_rating} count={s.google_rating_count} size={13} />
                        )}
                        {s.summary && <p>{s.summary}</p>}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
