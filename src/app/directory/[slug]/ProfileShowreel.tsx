"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Play } from "lucide-react";
import styles from "./Listing.module.css";

/**
 * A direct-video (e.g. .mp4) showreel on a listing profile, behaving like the
 * homepage reel: autoplays muted when scrolled into view, loops, has a sound
 * toggle, and can be paused/played by clicking the video. Full-width 16:9 frame.
 */
export function ProfileShowreel({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  // Once the viewer pauses it themselves, don't let scroll-autoplay override them.
  const userPausedRef = useRef(false);

  // Keep the play/pause overlay in sync with the actual video state.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, []);

  // Autoplay (muted) when it scrolls into view; pause when it leaves. Respects a
  // manual pause so scrolling doesn't restart what the viewer stopped.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!userPausedRef.current) video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      userPausedRef.current = false;
      video.play().catch(() => {});
    } else {
      userPausedRef.current = true;
      video.pause();
    }
  }

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
        aria-label="Showreel — click to play or pause"
        onClick={togglePlay}
      />
      {!playing && (
        <button type="button" className={styles.showreelPlay} onClick={togglePlay} aria-label="Play showreel">
          <Play aria-hidden="true" size={28} />
        </button>
      )}
      <button type="button" className={styles.showreelSound} onClick={toggleSound} aria-pressed={!muted}>
        {muted ? <VolumeX aria-hidden="true" size={15} /> : <Volume2 aria-hidden="true" size={15} />}
        {muted ? "Sound off" : "Sound on"}
      </button>
    </div>
  );
}
