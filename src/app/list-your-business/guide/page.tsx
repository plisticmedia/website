import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, UserPlus, Image as ImageIcon, Film, Tag, Rocket } from "lucide-react";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { toEmbedUrl } from "@/lib/images";
import styles from "./Guide.module.css";

export const metadata: Metadata = {
  title: "How to create your listing | Plistic",
  description:
    "A quick walkthrough of setting up your free Plistic listing — from creating your account to photos, showreel, packages and going live.",
};

// The edited walkthrough video. Paste the YouTube / Vimeo / Google Drive share
// link here (unlisted is fine) — it embeds and streams, so there's no large
// file to host. Leave blank to show a "coming soon" placeholder.
const VIDEO_URL = "https://youtu.be/05V9SVDKDnE";

const steps = [
  { icon: UserPlus, title: "Create your free account", body: "It only takes a minute, and your listing is always yours to manage." },
  { icon: ImageIcon, title: "Add your details & photos", body: "Your story, services, areas you cover, logo and a gallery of your work." },
  { icon: Film, title: "Add a showreel", body: "Paste a YouTube, Vimeo or video link and it plays right on your profile." },
  { icon: Tag, title: "Set packages & items", body: "List your pricing tiers, and sell products or services in the marketplace." },
  { icon: Rocket, title: "Go live", body: "Submit for review — once approved, buyers can find, book and enquire." },
];

export default function ListingGuidePage() {
  const embed = toEmbedUrl(VIDEO_URL);
  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className="p-container">
            <p className={styles.kicker}>How it works</p>
            <h1>
              Create your listing in <span>minutes</span>.
            </h1>
            <p className={styles.lead}>
              Watch a quick walkthrough of setting up your free Plistic listing — then start your own. It&apos;s free to be
              listed.
            </p>
          </div>
        </section>

        <section className={`p-container ${styles.body}`}>
          <div className={styles.videoWrap}>
            {embed ? (
              <iframe
                className={styles.video}
                src={embed}
                title="How to create your Plistic listing"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className={styles.videoSoon}>Walkthrough video coming soon.</div>
            )}
          </div>

          <div className={styles.ctaRow}>
            <Link className={styles.primaryBtn} href="/list-your-business">
              List your business <ArrowRight aria-hidden="true" size={18} />
            </Link>
            <Link className={styles.backLink} href="/list-your-business">
              <ArrowLeft aria-hidden="true" size={16} /> Back
            </Link>
          </div>

          <ol className={styles.steps}>
            {steps.map((s, i) => (
              <li key={s.title}>
                <span className={styles.stepIcon} aria-hidden="true">
                  <s.icon size={20} />
                </span>
                <div>
                  <strong>
                    {i + 1}. {s.title}
                  </strong>
                  <p>{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <Footer />
    </>
  );
}
