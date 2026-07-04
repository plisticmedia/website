"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Maximize2, Volume2, VolumeX, X } from "lucide-react";
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
  const [expanded, setExpanded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setS((o) => ({ i: (o.i + 1) % prefixWords.length, prev: o.i, n: o.n + 1 }));
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!expanded) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setExpanded(false);
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [expanded]);

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
              Get an instant estimate
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
            poster="/assets/showreel/showreel-poster.webp"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="Plistic showreel"
          >
            <source src="/assets/showreel/showreel-web.webm" type="video/webm" />
            <source src="/assets/showreel/showreel-web.mp4" type="video/mp4" />
          </video>
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
          <button
            type="button"
            className={styles.expand}
            onClick={() => setExpanded(true)}
            aria-label="Expand showreel"
          >
            <Maximize2 aria-hidden="true" size={15} />
            Expand
          </button>
        </div>
      </div>

      {expanded ? (
        <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label="Expanded Plistic showreel">
          <button
            type="button"
            className={styles.lightboxBackdrop}
            onClick={() => setExpanded(false)}
            aria-label="Dismiss expanded showreel"
          />
          <div className={styles.lightboxFrame}>
            <button type="button" className={styles.close} onClick={() => setExpanded(false)} aria-label="Close showreel">
              <X aria-hidden="true" size={20} />
            </button>
            <video
              className={styles.lightboxVideo}
              poster="/assets/showreel/showreel-poster.webp"
              autoPlay
              muted={!soundOn}
              loop
              playsInline
              controls
              aria-label="Expanded Plistic showreel"
            >
              <source src="/assets/showreel/showreel-web.webm" type="video/webm" />
              <source src="/assets/showreel/showreel-web.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      ) : null}
    </section>
  );
}
