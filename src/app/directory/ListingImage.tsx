"use client";

import { useState } from "react";

/**
 * Logo for a directory card. Falls back to a clean monogram tile if the image
 * is missing OR fails to load (e.g. a Drive file that isn't public) — so a
 * broken-image icon is never shown.
 */
export function LogoImage({
  src,
  alt,
  initial,
  initialClassName,
}: {
  src: string | null;
  alt: string;
  initial: string;
  initialClassName: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span className={initialClassName} aria-hidden="true">
        {initial}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}

/**
 * Cover/logo image on the listing detail page. Renders nothing if the image is
 * missing or fails to load, so there's no broken image and no empty frame.
 */
export function CoverImage({
  src,
  alt,
  className,
  wrapClassName,
}: {
  src: string | null;
  alt: string;
  className: string;
  wrapClassName: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return (
    <section className={wrapClassName}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={className} src={src} alt={alt} onError={() => setFailed(true)} />
    </section>
  );
}
