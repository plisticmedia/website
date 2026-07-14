"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import styles from "./Showreel.module.css";

// Self-hosted showreel so it can autoplay (Google Drive embeds can't).
// Drop the compressed final cut here and it plays automatically on scroll:
//   public/assets/video/showreel.mp4   (1080p H.264, ideally < ~25 MB)
const SHOWREEL_SRC = "/assets/video/showreel.mp4";

// Still-frame poster (shown before playback / if the video is missing),
// picked at random from our own production photos on each visit.
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  // Deterministic for SSR, randomised on the client (avoids hydration mismatch).
  const [poster, setPoster] = useState(POSTERS[0]);

  useEffect(() => {
    setPoster(POSTERS[Math.floor(Math.random() * POSTERS.length)]);
  }, []);

  // Autoplay (muted) when the reel scrolls into view; pause when it leaves.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.4 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (!video.muted) video.play().catch(() => {});
  }

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
          <video
            ref={videoRef}
            className={styles.video}
            poster={poster}
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="Plistic showreel"
          >
            <source src={SHOWREEL_SRC} type="video/mp4" />
          </video>
          <button type="button" className={styles.sound} onClick={toggleSound} aria-pressed={!muted}>
            {muted ? <VolumeX aria-hidden="true" size={15} /> : <Volume2 aria-hidden="true" size={15} />}
            {muted ? "Sound off" : "Sound on"}
          </button>
        </div>
      </div>
    </section>
  );
}
