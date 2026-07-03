"use client";

/**
 * Prints the current page (browsers offer "Save as PDF"). Replaces a static PDF
 * download so the saved copy always matches the live on-page document — no risk
 * of handing out a stale PDF.
 */
export function PrintButton({ className, label = "Print / Save as PDF" }: { className?: string; label?: string }) {
  return (
    <button type="button" className={`${className ?? ""} no-print`} onClick={() => window.print()}>
      {label}
    </button>
  );
}
