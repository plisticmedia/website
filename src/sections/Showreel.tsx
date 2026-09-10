"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Play, Maximize, Minimize } from "lucide-react";
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
  const frameRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  // Once the viewer pauses it themselves, don't let scroll-autoplay override them.
  const userPausedRef = useRef(false);
  // Deterministic for SSR, randomised on the client (avoids hydration mismatch).
  const [poster, setPoster] = useState(POSTERS[0]);

  useEffect(() => {
    setPoster(POSTERS[Math.floor(Math.random() * POSTERS.length)]);
  }, []);

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

  // Autoplay (muted) when the reel scrolls into view; pause when it leaves.
  // Respects a manual pause so scrolling doesn't restart what the viewer stopped.
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

  // Keep the button in sync when the viewer leaves fullscreen with Esc, etc.
  useEffect(() => {
    const onChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element };
      setFullscreen(Boolean(document.fullscreenElement || doc.webkitFullscreenElement));
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  function toggleFullscreen() {
    const frame = frameRef.current;
    const video = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    const doc = document as Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void };
    if (!frame || !video) return;

    if (document.fullscreenElement || doc.webkitFullscreenElement) {
      (document.exitFullscreen || doc.webkitExitFullscreen)?.call(document);
      return;
    }
    const el = frame as HTMLDivElement & { webkitRequestFullscreen?: () => void };
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else if (video.webkitEnterFullscreen) {
      // iOS Safari can only fullscreen the video element itself.
      video.webkitEnterFullscreen();
    }
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
        <div className={styles.frame} ref={frameRef}>
          <video
            ref={videoRef}
            className={styles.video}
            poster={poster}
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="Plistic showreel — click to play or pause"
            onClick={togglePlay}
          >
            <source src={SHOWREEL_SRC} type="video/mp4" />
          </video>
          {!playing && (
            <button type="button" className={styles.playOverlay} onClick={togglePlay} aria-label="Play showreel">
              <Play aria-hidden="true" size={30} />
            </button>
          )}
          <div className={styles.controls}>
            <button type="button" className={styles.sound} onClick={toggleSound} aria-pressed={!muted}>
              {muted ? <VolumeX aria-hidden="true" size={15} /> : <Volume2 aria-hidden="true" size={15} />}
              {muted ? "Sound off" : "Sound on"}
            </button>
            <button
              type="button"
              className={styles.sound}
              onClick={toggleFullscreen}
              aria-pressed={fullscreen}
              aria-label={fullscreen ? "Exit full screen" : "Full screen"}
            >
              {fullscreen ? <Minimize aria-hidden="true" size={15} /> : <Maximize aria-hidden="true" size={15} />}
              {fullscreen ? "Exit" : "Fullscreen"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
