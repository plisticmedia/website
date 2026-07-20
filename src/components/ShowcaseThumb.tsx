"use client";

import { useState } from "react";

/**
 * Showcase media that never looks broken: renders the image, and if there's no
 * image or it fails to load (404, blocked thumbnail, bad upload), falls back to
 * a branded placeholder showing the item kind. Use inside a positioned
 * `.media` container.
 */
export function ShowcaseThumb({
  src,
  alt,
  kindLabel,
  imgClassName,
  placeholderClassName,
}: {
  src: string | null;
  alt: string;
  kindLabel: string;
  imgClassName?: string;
  /** Omit to hide (render nothing) when there's no image or it fails to load. */
  placeholderClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} loading="lazy" className={imgClassName} onError={() => setFailed(true)} />;
  }
  if (!placeholderClassName) return null;
  return (
    <div className={placeholderClassName} aria-hidden="true">
      <span>{kindLabel}</span>
    </div>
  );
}
