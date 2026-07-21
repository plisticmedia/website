"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import styles from "./Listing.module.css";

/**
 * A direct-video (e.g. .mp4) showreel on a listing profile, behaving like the
 * homepage reel: autoplays muted when scrolled into view, loops, and has a
 * sound toggle. Full-width 16:9 frame to match the homepage size.
 */
export function ProfileShowreel({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  // Autoplay (muted) when it scrolls into view; pause when it leaves.
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
    <div className={styles.showreel}>
      <video
        ref={videoRef}
        className={styles.showreelVideo}
        src={src}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="Showreel"
      />
      <button type="button" className={styles.showreelSound} onClick={toggleSound} aria-pressed={!muted}>
        {muted ? <VolumeX aria-hidden="true" size={15} /> : <Volume2 aria-hidden="true" size={15} />}
        {muted ? "Sound off" : "Sound on"}
      </button>
    </div>
  );
}
