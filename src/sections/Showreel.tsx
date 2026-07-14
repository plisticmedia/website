"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import styles from "./Showreel.module.css";

// The final showreel lives on Google Drive. Drive's player can't autoplay in an
// embed, so we show a poster with a play button and only load the player
// (autoplaying) once the visitor clicks.
// ⚠️ The Drive file must be shared "Anyone with the link — Viewer".
// File: "Plistic Media Showreel Final.mp4"
const SHOWREEL_EMBED = "https://drive.google.com/file/d/1DiW92NcLN6JvxUylh28i4lx5Jvj0eIow/preview";

// Poster is one of our own production photos, picked at random on each visit.
const POSTERS = [
  "/assets/photos/site/kokura-luck.jpg",
  "/assets/photos/site/scarlet-prism.jpg",
  "/assets/photos/site/news-room.jpg",
  "/assets/photos/site/accelerateher.jpg",
  "/assets/photos/site/accelerateher-3.jpg",
  "/assets/photos/site/documentary-1.jpg",
  "/assets/photos/site/documentary-3.jpg",
  "/assets/photos/site/inspire-2.jpg",
  "/assets/photos/site/ross-anderson.jpg",
  "/assets/photos/site/connect-ed-1.jpg",
];

export function Showreel() {
  const [playing, setPlaying] = useState(false);
  // Start deterministic for SSR, then randomise on the client to avoid a
  // hydration mismatch — this makes it a different photo on each visit.
  const [poster, setPoster] = useState(POSTERS[0]);

  useEffect(() => {
    setPoster(POSTERS[Math.floor(Math.random() * POSTERS.length)]);
  }, []);

  return (
    <section className={`p-section ${styles.section}`} id="showreel" aria-labelledby="showreel-title">
      <div className="p-container">
        <div className={styles.head}>
          <p className="p-eyebrow">Showreel</p>
          <h2 id="showreel-title" className={`p-h2 ${styles.title}`}>
            A minute of <span className="azu">what we make</span>.
          </h2>
        </div>
        <div className={styles.frame}>
          {playing ? (
            <iframe
              src={`${SHOWREEL_EMBED}?autoplay=1`}
              title="Plistic showreel"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              className={styles.poster}
              onClick={() => setPlaying(true)}
              aria-label="Play the Plistic showreel"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={poster} alt="" className={styles.posterImg} loading="lazy" />
              <span className={styles.posterScrim} aria-hidden="true" />
              <span className={styles.playBtn} aria-hidden="true">
                <Play size={30} fill="currentColor" />
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
