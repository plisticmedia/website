"use client";

import { useCallback, useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { toEmbedUrl } from "@/lib/images";
import { ProfileShowreel } from "./ProfileShowreel";
import styles from "./Listing.module.css";

type Item = { id: string; url: string; kind: string };

/**
 * The listing's portfolio gallery. Images open in a full-screen lightbox that
 * you can close, and step through with on-screen arrows or the keyboard.
 * Videos and embeds render inline as before.
 */
export function ProfileGallery({ items }: { items: Item[] }) {
  // Just the images, in order — what the lightbox steps through.
  const images = items.filter((m) => m.kind !== "embed" && m.kind !== "video" && !!m.url);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const isOpen = openIndex !== null;

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (dir: number) => setOpenIndex((i) => (i === null ? i : (i + dir + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    }
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, close, step]);

  let imageCounter = -1;

  return (
    <>
      <div className={styles.gallery} aria-label="Portfolio samples">
        {items.map((m) => {
          const embed = m.kind === "embed" ? toEmbedUrl(m.url) : null;
          if (embed) {
            return (
              <div key={m.id} className={styles.galleryEmbed}>
                <iframe
                  src={embed}
                  title="Showreel"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            );
          }
          if (m.kind === "video") return <ProfileShowreel key={m.id} src={m.url} />;
          imageCounter += 1;
          const idx = imageCounter;
          return (
            <button
              key={m.id}
              type="button"
              className={styles.galleryImageBtn}
              onClick={() => setOpenIndex(idx)}
              aria-label="View image full screen"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt="" loading="lazy" className={styles.galleryItem} />
            </button>
          );
        })}
      </div>

      {isOpen && images[openIndex] && (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onClick={close}
        >
          <button type="button" className={styles.lightboxClose} onClick={close} aria-label="Close">
            <X aria-hidden="true" size={26} />
          </button>

          {images.length > 1 && (
            <button
              type="button"
              className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              aria-label="Previous image"
            >
              <ChevronLeft aria-hidden="true" size={30} />
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[openIndex].url}
            alt=""
            className={styles.lightboxImg}
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <button
              type="button"
              className={`${styles.lightboxNav} ${styles.lightboxNext}`}
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              aria-label="Next image"
            >
              <ChevronRight aria-hidden="true" size={30} />
            </button>
          )}

          {images.length > 1 && (
            <span className={styles.lightboxCount}>
              {openIndex + 1} / {images.length}
            </span>
          )}
        </div>
      )}
    </>
  );
}
