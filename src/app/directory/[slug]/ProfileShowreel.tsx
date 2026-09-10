"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Play, Maximize, Minimize } from "lucide-react";
import styles from "./Listing.module.css";

/**
 * A direct-video (e.g. .mp4) showreel on a listing profile, behaving like the
 * homepage reel: autoplays muted when scrolled into view, loops, has a sound
 * toggle, and can be paused/played by clicking the video. Full-width 16:9 frame.
 */
export function ProfileShowreel({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
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
    <div className={styles.showreel} ref={frameRef}>
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
      <div className={styles.showreelControls}>
        <button type="button" className={styles.showreelSound} onClick={toggleSound} aria-pressed={!muted}>
          {muted ? <VolumeX aria-hidden="true" size={15} /> : <Volume2 aria-hidden="true" size={15} />}
          {muted ? "Sound off" : "Sound on"}
        </button>
        <button
          type="button"
          className={styles.showreelSound}
          onClick={toggleFullscreen}
          aria-pressed={fullscreen}
          aria-label={fullscreen ? "Exit full screen" : "Full screen"}
        >
          {fullscreen ? <Minimize aria-hidden="true" size={15} /> : <Maximize aria-hidden="true" size={15} />}
          {fullscreen ? "Exit" : "Fullscreen"}
        </button>
      </div>
    </div>
  );
}
