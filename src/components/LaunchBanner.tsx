"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { launchOffer, launchOfferExpiresAt } from "@/data/site";

const storageKey = "plistic-launch-banner-dismissed";

export function LaunchBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hasExpired = Date.now() > new Date(launchOfferExpiresAt).getTime();

    setVisible(!hasExpired && window.localStorage.getItem(storageKey) !== "true");
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="launch-banner">
      <div className="launch-banner-shell">
        <div className="launch-banner-copy">
          <span className="launch-banner-icon" aria-hidden="true">
            <Sparkles size={15} />
          </span>
          <div className="launch-banner-text">
            <strong>{launchOffer.eyebrow}</strong>
            <span>{launchOffer.body}</span>
          </div>
        </div>
        <div className="launch-banner-actions">
          <Link href="/pricing">
            <span>{launchOffer.cta}</span>
            <ArrowRight aria-hidden="true" size={15} />
          </Link>
          <button
            type="button"
            aria-label="Dismiss launch offer"
            onClick={() => {
              window.localStorage.setItem(storageKey, "true");
              setVisible(false);
            }}
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
