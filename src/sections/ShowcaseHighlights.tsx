import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  getFeaturedShowcaseItems,
  showcaseHref,
  showcaseThumb,
  toShowcaseEmbed,
  type ShowcaseKind,
} from "@/lib/showcase";
import { ShowcaseCarousel } from "./ShowcaseCarousel";
import styles from "./ShowcaseHighlights.module.css";

function kindLabel(kind: ShowcaseKind): string {
  return kind === "work" ? "Work" : kind === "video" ? "Film" : kind.charAt(0).toUpperCase() + kind.slice(1);
}

/**
 * Homepage highlights carousel for Scotland's Showcase — the featured stories,
 * pulled live. Renders nothing until there are at least two to scroll through.
 */
export async function ShowcaseHighlights() {
  const items = await getFeaturedShowcaseItems(10);
  if (items.length < 2) return null;

  const cards = items.map((i) => ({
    id: i.id,
    title: i.title,
    summary: i.summary,
    kindLabel: kindLabel(i.kind),
    href: showcaseHref(i),
    thumb: showcaseThumb(i),
    hasVideo: !!toShowcaseEmbed(i.embed_url),
    source: i.source,
    location: i.location,
  }));

  return (
    <section className={`p-section ${styles.section}`} aria-labelledby="showcase-hl-title">
      <div className="p-container">
        <div className={styles.head}>
          <div>
            <p className="p-eyebrow">Scotland&apos;s Showcase</p>
            <h2 id="showcase-hl-title" className="p-h2">
              The best of <span className="azu">Scotland&apos;s creative scene</span>.
            </h2>
          </div>
          <Link href="/showcase" className={styles.seeAll}>
            See the full showcase <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
        <ShowcaseCarousel cards={cards} />
      </div>
    </section>
  );
}
