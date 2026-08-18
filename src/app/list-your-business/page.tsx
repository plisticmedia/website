import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Mail, Sparkles, Search, UserPlus, ArrowRight } from "lucide-react";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { getCategories, getLocations } from "@/lib/services";
import { getSessionProfile } from "@/lib/auth";
import { SubmitListingForm } from "./SubmitListingForm";
import styles from "./Submit.module.css";

export const metadata: Metadata = {
  title: "List your business | Plistic directory",
  description: "Add your business to Plistic's directory of Scottish media and creative partners.",
};

export const dynamic = "force-dynamic";

const NEXT = "/list-your-business";

export default async function ListYourBusinessPage() {
  const [categories, locations, profile] = await Promise.all([
    getCategories(),
    getLocations(),
    getSessionProfile(),
  ]);

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className="p-container">
            <p className={styles.kicker}>Join Scotland&apos;s creative directory</p>
            <h1>
              Get found by people who need <span>Scotland&apos;s creative talent</span>.
            </h1>
            <p className={styles.lead}>
              Plistic is a directory and marketplace for Scotland&apos;s creative and media businesses — film &amp; TV,
              music, games, animation, design, PR, audio, photography and the studios and venues behind them. Buyers
              (brands, charities, broadcasters and productions) come here to find and hire you — <strong>free</strong>.
              Add your business now and start getting found.
            </p>
          </div>
        </section>

        <section className={`p-container ${styles.body} ${profile ? "" : styles.bodyGate}`}>
          <div className={styles.benefits}>
            <h2>Why list with Plistic — it&apos;s free</h2>
            <ul>
              <li>
                <Sparkles aria-hidden="true" size={18} />
                <div>
                  <strong>A profile you&apos;ll be proud to share</strong>
                  <p>Logo, showreel, portfolio, services, coverage and links — all on a clean, shareable page.</p>
                </div>
              </li>
              <li>
                <Search aria-hidden="true" size={18} />
                <div>
                  <strong>Get found</strong>
                  <p>Appear in search, on the map of Scotland, and by service and location — with good SEO.</p>
                </div>
              </li>
              <li>
                <Mail aria-hidden="true" size={18} />
                <div>
                  <strong>Free enquiries</strong>
                  <p>Buyers message you directly. Leads land in your inbox and by email.</p>
                </div>
              </li>
              <li>
                <MapPin aria-hidden="true" size={18} />
                <div>
                  <strong>Built for Scotland&apos;s ecosystem</strong>
                  <p>Verified and founding‑partner badges, a curated talent showcase, and profile insights.</p>
                </div>
              </li>
            </ul>
          </div>

          {profile ? (
            <SubmitListingForm categories={categories} locations={locations} />
          ) : (
            <div className={styles.accountGate}>
              <span className={styles.accountGateIcon} aria-hidden="true">
                <UserPlus size={22} />
              </span>
              <h2>First, create your free business account</h2>
              <p className={styles.accountGateLead}>
                Your listing lives in your own account, so you can edit it, reply to enquiries and take bookings any
                time. It only takes a minute.
              </p>
              <Link className={styles.accountGateBtn} href={`/login?as=business&signup=1&next=${NEXT}`}>
                Create a free account <ArrowRight aria-hidden="true" size={17} />
              </Link>
              <p className={styles.accountGateAlt}>
                Already have an account? <Link href={`/login?as=business&next=${NEXT}`}>Sign in to list</Link>
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
