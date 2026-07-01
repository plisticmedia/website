import type { Metadata } from "next";
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
            <p className={styles.kicker}>Join the directory</p>
            <h1>
              List your <span>business</span>.
            </h1>
            <p className={styles.lead}>
              Tell us about your work and upload your logo. We review every submission before it goes live — it&apos;s
              free to be listed.
            </p>
          </div>
        </section>

        <section className={`p-container ${styles.body}`}>
          <SubmitListingForm categories={categories} locations={locations} />
        </section>
      </main>
      <Footer />
    </>
  );
}
