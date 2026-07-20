"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { ShowcaseThumb } from "@/components/ShowcaseThumb";
import styles from "./ShowcaseHighlights.module.css";

export type ShowcaseCardData = {
  id: string;
  title: string;
  summary: string | null;
  kindLabel: string;
  href: string | null;
  thumb: string | null;
  hasVideo: boolean;
  source: string | null;
  location: string | null;
};

export function ShowcaseCarousel({ cards }: { cards: ShowcaseCardData[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scroll(dir: 1 | -1) {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  }

  return (
    <div className={styles.carousel}>
      <div className={styles.track} ref={trackRef}>
        {cards.map((c) => (
          <article className={styles.card} key={c.id}>
            <Link href={c.href ?? "/showcase"} className={styles.cardLink}>
              <div className={styles.media}>
                <ShowcaseThumb
                  src={c.thumb}
                  alt={c.title}
                  kindLabel={c.kindLabel}
                  placeholderClassName={styles.mediaEmpty}
                />
                {c.hasVideo && (
                  <span className={styles.play} aria-hidden="true">
                    <Play size={20} fill="currentColor" />
                  </span>
                )}
              </div>
              <div className={styles.body}>
                <span className={styles.kind}>{c.kindLabel}</span>
                <h3>{c.title}</h3>
                {c.summary && <p>{c.summary}</p>}
                {c.source && (
                  <span className={styles.source}>{c.location ? `${c.source} · ${c.location}` : c.source}</span>
                )}
              </div>
            </Link>
          </article>
        ))}
      </div>

      <div className={styles.nav}>
        <button type="button" onClick={() => scroll(-1)} aria-label="Previous stories">
          <ChevronLeft size={20} />
        </button>
        <button type="button" onClick={() => scroll(1)} aria-label="More stories">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
