"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, X } from "lucide-react";
import styles from "./DashboardTour.module.css";

type Step = { title: string; body: string; href?: string; cta?: string };

const STORAGE_KEY = "plistic-dashboard-tour-v1";

const BUSINESS_STEPS: Step[] = [
  { title: "Welcome to Plistic 👋", body: "This is your dashboard. Here's a 20-second tour of what you can do — you can replay it any time from “Show me around”." },
  { title: "Build your listing", body: "In My listings, add your logo, photos, a showreel, your services and your prices. The more complete your page, the more enquiries you'll get.", href: "/dashboard/listings", cta: "Go to My listings" },
  { title: "Get found & hired", body: "People searching the directory find you and send enquiries straight to your inbox — and by email. You deal with them directly, no middleman." },
  { title: "Take paid bookings", body: "Connect a payout account to sell bookable packages online. Payment is held securely and released to you once the work is confirmed delivered.", href: "/dashboard/payouts", cta: "Set up payouts" },
  { title: "Keep your account safe", body: "Turn on two-factor authentication for an extra layer of security on your account.", href: "/dashboard/security", cta: "Security settings" },
];

const BUYER_STEPS: Step[] = [
  { title: "Welcome to Plistic 👋", body: "You're all set to hire Scotland's creative talent. Here's the quick version — you can replay it any time from “Show me around”." },
  { title: "Find the right people", body: "Browse the directory, or compare bookable services side by side by price, delivery time and rating.", href: "/compare", cta: "Compare services" },
  { title: "Book with confidence", body: "When you book, your payment is held safely in escrow and only released to the seller once the work is delivered — so you're protected." },
  { title: "Track your orders", body: "Everything you book lives in My orders, where you can confirm delivery or raise an issue if something's not right.", href: "/dashboard/orders", cta: "My orders" },
  { title: "Are you a business too?", body: "If you also offer creative services, you can list your business any time — just tap “List my business” on your dashboard." },
];

export function DashboardTour({ isBusiness, replay = false }: { isBusiness: boolean; replay?: boolean }) {
  const steps = isBusiness ? BUSINESS_STEPS : BUYER_STEPS;
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (replay) {
      setI(0);
      setOpen(true);
      return;
    }
    try {
      if (window.localStorage.getItem(STORAGE_KEY) !== "true") setOpen(true);
    } catch {
      /* ignore */
    }
  }, [replay]);

  function close() {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
  }

  if (!open) return null;
  const step = steps[i];
  const last = i === steps.length - 1;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Dashboard tour">
      <div className={styles.backdrop} onClick={close} />
      <div className={styles.card}>
        <button type="button" className={styles.close} aria-label="Close tour" onClick={close}>
          <X aria-hidden="true" size={18} />
        </button>
        <div className={styles.dots} aria-hidden="true">
          {steps.map((_, idx) => (
            <span key={idx} className={idx === i ? styles.dotActive : styles.dot} />
          ))}
        </div>
        <h2 className={styles.title}>{step.title}</h2>
        <p className={styles.body}>{step.body}</p>
        {step.href && step.cta && (
          <Link href={step.href} className={styles.stepLink} onClick={close}>
            {step.cta} <ArrowRight aria-hidden="true" size={15} />
          </Link>
        )}
        <div className={styles.nav}>
          {i > 0 ? (
            <button type="button" className={styles.ghostBtn} onClick={() => setI((v) => v - 1)}>
              <ArrowLeft aria-hidden="true" size={16} /> Back
            </button>
          ) : (
            <button type="button" className={styles.ghostBtn} onClick={close}>
              Skip
            </button>
          )}
          {last ? (
            <button type="button" className="p-btn" onClick={close}>
              Got it
            </button>
          ) : (
            <button type="button" className="p-btn" onClick={() => setI((v) => v + 1)}>
              Next <ArrowRight aria-hidden="true" size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
