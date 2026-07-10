import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Home, Search } from "lucide-react";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "Page not found | Plistic", robots: { index: false } };

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="notfound-main">
        <div className="notfound-card">
          <p className="notfound-code">404</p>
          <h1>We couldn&apos;t find that page</h1>
          <p className="notfound-lead">
            The link may be out of date or the page may have moved. Let&apos;s get you back on track.
          </p>
          <div className="notfound-actions">
            <Link href="/" className="p-btn">
              <Home aria-hidden="true" size={18} /> Back to home
            </Link>
            <Link href="/directory" className="p-btn p-btn--ghost">
              <Search aria-hidden="true" size={18} /> Browse the directory
            </Link>
          </div>
          <p className="notfound-help">
            Looking for your own business page?{" "}
            <Link href="/login">Sign in</Link> or <Link href="/list-your-business">list your business</Link>.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
