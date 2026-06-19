"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { launchOffer } from "@/data/site";

const storageKey = "plistic-launch-banner-dismissed";

export function LaunchBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(window.localStorage.getItem(storageKey) !== "true");
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="launch-banner">
      <div>
        <strong>{launchOffer.eyebrow}</strong>
        <span>{launchOffer.body}</span>
      </div>
      <Link href="/pricing">{launchOffer.cta}</Link>
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
  );
}
