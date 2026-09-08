// Client-safe discount helpers and types. No server-only imports here so this
// can be pulled into the pricing calculator (a client component). The actual
// code lookup / validation against the database lives in discountsServer.ts.

import type { MoneyRange } from "@/data/pricing";
import type { ServiceChoice } from "@/lib/pricing";

export type DiscountType = "percent" | "fixed";

/** The trimmed-down code details the estimator needs to show a discount. */
export type DiscountInfo = {
  code: string;
  label: string | null;
  discountType: DiscountType;
  discountValue: number;
};

/** Which estimator service a code targets, or "all" for any. */
export type DiscountService = ServiceChoice | "all";

export const DISCOUNT_SERVICE_LABELS: Record<DiscountService, string> = {
  all: "All services",
  podcast: "Podcast",
  event: "Event filming",
  musicVideo: "Music video",
  documentary: "Documentary",
  coaching: "Coaching",
  other: "Other",
};

/** Normalise a code the way it's stored and compared: trimmed + uppercased. */
export function normaliseCode(code: string): string {
  return code.trim().toUpperCase();
}

/** Human summary of a discount, e.g. "50% off" or "£100 off". */
export function discountSummary(info: Pick<DiscountInfo, "discountType" | "discountValue">): string {
  return info.discountType === "percent"
    ? `${info.discountValue}% off`
    : `£${info.discountValue.toLocaleString("en-GB")} off`;
}

/**
 * Apply a discount to an estimate range. Percentages scale both ends; fixed
 * amounts come off both ends (never below zero). Rounded to the nearest £50 to
 * match the estimator's house style. Returns null when there's no range to
 * discount (e.g. "scoped on call").
 */
export function applyDiscountToRange(range: MoneyRange | null, info: DiscountInfo): MoneyRange | null {
  if (!range) return null;

  const apply = (value: number): number => {
    const discounted =
      info.discountType === "percent"
        ? value * (1 - info.discountValue / 100)
        : value - info.discountValue;
    return Math.max(0, Math.round(discounted / 50) * 50);
  };

  return {
    low: apply(range.low),
    high: apply(range.high),
    qualifier: range.qualifier,
    plus: range.plus,
  };
}
