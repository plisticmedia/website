"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Volume2, VolumeX } from "lucide-react";
import { bookingPagePath, prefixWords } from "@/data/site";
import styles from "./Hero.module.css";

const trustLogos = [
  { name: "King's Trust", src: "/assets/logos/king-s-trust-logo-svg.png" },
  { name: "Robert Gordon University", src: "/assets/logos/rgu-logo.png" },
  { name: "Techscaler", src: "/assets/logos/techscaler-logo.png" },
];

export function Hero() {
  const [s, setS] = useState({ i: 0, prev: -1, n: 0 });
  const [soundOn, setSoundOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setS((o) => ({ i: (o.i + 1) % prefixWords.length, prev: o.i, n: o.n + 1 }));
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  function toggleSound() {
    const v = videoRef.current;
    if (!v) return;
    const next = !soundOn;
    v.muted = !next;
    setSoundOn(next);
    if (next) {
      const p = v.play();
      if (p) p.catch(() => {});
    }
  }

  const word = prefixWords[s.i];
  const prevWord = s.n > 0 && s.prev >= 0 ? prefixWords[s.prev] : null;

  return (
    <section className={styles.hero} id="top" aria-labelledby="hero-mark">
      {/* LEFT — copy panel */}
      <div className={styles.panel}>
        <div className={styles.inner}>
          <p className={styles.eyebrow}>Glasgow · Made in Scotland</p>

          <h1 className={styles.mark} id="hero-mark" role="img" aria-label={`${word}plistic`}>
            <span className={styles.prefix} aria-hidden="true">
              {prevWord && (
                <span key={`x${s.n}`} className={`${styles.slot} ${styles.exiting}`}>
                  {prevWord}
                </span>
              )}
              <span key={`e${s.n}`} className={`${styles.word} ${styles.entering}`}>
                {word}
              </span>
            </span>
            <span className={`${styles.brk} ${styles.brkL}`} aria-hidden="true" />
            <span className={styles.name}>PLISTIC</span>
            <span className={`${styles.brk} ${styles.brkR}`} aria-hidden="true" />
          </h1>

          <p className={styles.tagline}>
            media made <span className={styles.sim}>sim</span>PLISTIC
          </p>
          <p className={styles.subhead}>Scotland&apos;s home for everything media. Made in Scotland.</p>
          <p className={styles.disciplines}>
            Podcasts <i>·</i> Video <i>·</i> Documentary <i>·</i> Ads <i>·</i> Music Videos <i>·</i> Strategy
          </p>

          <div className={styles.cta}>
            <Link className={styles.btn} href="/pricing">
              Get a Quote
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
            <Link className={`${styles.btn} ${styles.btnGhost}`} href={bookingPagePath}>
              <CalendarDays aria-hidden="true" size={18} />
              Book a Call
            </Link>
          </div>

          <div className={styles.trust}>
            <span className={styles.trustLabel}>Trusted by</span>
            <div className={styles.logos}>
              {trustLogos.map((logo) => (
                <span className={styles.chip} key={logo.name}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo.src} alt={logo.name} />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — viewfinder-framed showreel */}
      <div className={styles.media} aria-label="Plistic showreel">
        <div className={styles.frame}>
          <span className={styles.frameC} aria-hidden="true" />
          <video
            ref={videoRef}
            className={styles.video}
            src="/assets/showreel/showreel-web.mp4"
            poster="/assets/showreel/showreel-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="Plistic showreel"
          />
          <span className={styles.glow} aria-hidden="true" />
          <span className={styles.rec}>
            <span className={styles.recDot} aria-hidden="true" />
            REC
          </span>
          <span className={styles.tag}>
            <span className={styles.tagText}>Showreel</span>
          </span>
          <button type="button" className={styles.sound} onClick={toggleSound} aria-pressed={soundOn}>
            {soundOn ? <Volume2 aria-hidden="true" size={14} /> : <VolumeX aria-hidden="true" size={14} />}
            {soundOn ? "Sound on" : "Sound off"}
          </button>
        </div>
      </div>
    </section>
  );
}
