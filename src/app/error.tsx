"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RotateCw } from "lucide-react";

/**
 * App-level error boundary. Keeps a broken page from showing a blank/white
 * screen — offers a retry and a way home. Must be a client component.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface in logs for debugging (no sensitive detail shown to the user).
    console.error(error);
  }, [error]);

  return (
    <main className="notfound-main">
      <div className="notfound-card">
        <p className="notfound-code">Oops</p>
        <h1>Something went wrong</h1>
        <p className="notfound-lead">
          Sorry — that didn&apos;t work as expected. You can try again, or head back home.
        </p>
        <div className="notfound-actions">
          <button type="button" className="p-btn" onClick={reset}>
            <RotateCw aria-hidden="true" size={18} /> Try again
          </button>
          <Link href="/" className="p-btn p-btn--ghost">
            <Home aria-hidden="true" size={18} /> Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
