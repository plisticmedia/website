"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Megaphone, X } from "lucide-react";
import { bookingPagePath, launchOfferExpiresAt } from "@/data/site";
import styles from "./LaunchOfferPopup.module.css";

const offers = {
  event: {
    id: "event",
    title: "Launch offer",
    headline: "Up to 50% off full-day event filming",
    body: "Available until 14 August 2026, then this popup disappears automatically.",
    quoteHref: "/pricing",
  },
  podcast: {
    id: "podcast",
    title: "Launch offer",
    headline: "One episode free on podcast series of 6+ episodes",
    body: "Available until 14 August 2026, then this popup disappears automatically.",
    quoteHref: "/pricing",
  },
  documentary: {
    id: "documentary",
    title: "Launch offer",
    headline: "15% off documentary production",
    body: "Available until 14 August 2026, then this popup disappears automatically.",
    quoteHref: "/pricing",
  },
} as const;

type LaunchOfferPopupProps = {
  service: keyof typeof offers;
};

export function LaunchOfferPopup({ service }: LaunchOfferPopupProps) {
  const offer = offers[service];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissedKey = `plistic-launch-offer-${offer.id}-dismissed`;
    const hasExpired = Date.now() > new Date(launchOfferExpiresAt).getTime();

    setVisible(!hasExpired && window.localStorage.getItem(dismissedKey) !== "true");
  }, [offer.id]);

  if (!visible) {
    return null;
  }

  return (
    <aside className={styles.popup} aria-label={`${offer.headline} launch offer`}>
      <div className={styles.icon} aria-hidden="true">
        <Megaphone size={18} />
      </div>
      <div className={styles.copy}>
        <p>{offer.title}</p>
        <strong>{offer.headline}</strong>
        <span>{offer.body}</span>
      </div>
      <div className={styles.actions}>
        <Link href={offer.quoteHref}>
          Get an instant estimate
          <ArrowRight aria-hidden="true" size={15} />
        </Link>
        <Link href={bookingPagePath}>
          <CalendarDays aria-hidden="true" size={15} />
          Book a call
        </Link>
      </div>
      <button
        type="button"
        aria-label="Dismiss launch offer"
        onClick={() => {
          window.localStorage.setItem(`plistic-launch-offer-${offer.id}-dismissed`, "true");
          setVisible(false);
        }}
      >
        <X aria-hidden="true" size={17} />
      </button>
    </aside>
  );
}
