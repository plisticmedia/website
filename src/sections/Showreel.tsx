"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import styles from "./Showreel.module.css";

// The final showreel lives on Google Drive. Drive's player can't autoplay in an
// embed, so we show its thumbnail with a play button and only load the player
// (autoplaying) once the visitor clicks.
// ⚠️ The Drive file must be shared "Anyone with the link — Viewer".
// File: "Plistic Media Showreel Final.mp4"
const SHOWREEL_FILE_ID = "1DiW92NcLN6JvxUylh28i4lx5Jvj0eIow";
const SHOWREEL_EMBED = `https://drive.google.com/file/d/${SHOWREEL_FILE_ID}/preview`;
const SHOWREEL_THUMB = `https://drive.google.com/thumbnail?id=${SHOWREEL_FILE_ID}&sz=w1920`;

export function Showreel() {
  const [playing, setPlaying] = useState(false);

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
              <img src={SHOWREEL_THUMB} alt="" className={styles.posterImg} loading="lazy" />
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
