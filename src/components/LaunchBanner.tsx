"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { launchOffer } from "@/data/site";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
    <Alert className="launch-banner" role="status">
      <div className="launch-banner-shell">
        <div className="launch-banner-copy">
          <AlertTitle className="launch-banner-title">{launchOffer.eyebrow}</AlertTitle>
          <AlertDescription className="launch-banner-description">{launchOffer.body}</AlertDescription>
        </div>
        <AlertAction className="launch-banner-actions">
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
        </AlertAction>
      </div>
    </Alert>
  );
}
