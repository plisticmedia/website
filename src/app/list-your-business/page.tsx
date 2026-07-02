import type { Metadata } from "next";
import { MapPin, Mail, Sparkles, Search } from "lucide-react";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { getCategories, getLocations } from "@/lib/services";
import { SubmitListingForm } from "./SubmitListingForm";
import styles from "./Submit.module.css";

export const metadata: Metadata = {
  title: "List your business | Plistic directory",
  description: "Add your business to Plistic's directory of Scottish media and creative partners.",
};

export const dynamic = "force-dynamic";

export default async function ListYourBusinessPage() {
  const [categories, locations] = await Promise.all([getCategories(), getLocations()]);

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className="p-container">
            <p className={styles.kicker}>Join the directory · Launching July 2026</p>
            <h1>
              Get found by people who need <span>Scotland&apos;s creative talent</span>.
            </h1>
            <p className={styles.lead}>
              Plistic is a directory and marketplace for Scotland&apos;s creative and media businesses — film &amp; TV,
              music, games, animation, design, PR, audio, photography and the studios and venues behind them. Buyers
              (brands, charities, broadcasters and productions) come here to find and hire you, free. Add your business
              now and it&apos;ll be ready and waiting when we launch in <strong>July 2026</strong>.
            </p>
          </div>
        </section>

        <section className={`p-container ${styles.body}`}>
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
                  <p>Buyers message you directly. Leads land in your inbox and by email — no commission on the base tier.</p>
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

          <SubmitListingForm categories={categories} locations={locations} />
        </section>
      </main>
      <Footer />
    </>
  );
}
