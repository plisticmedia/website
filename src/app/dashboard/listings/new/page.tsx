import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { requireUser } from "@/lib/auth";
import { getCategories } from "@/lib/services";
import { createListing } from "../actions";
import styles from "../Listings.module.css";

export const metadata: Metadata = { title: "New listing | Plistic" };
export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  await requireUser("/dashboard/listings/new");
  const categories = await getCategories();

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.innerNarrow}`}>
          <p className={styles.kicker}>
            <Link href="/dashboard/listings">My listings</Link> / New
          </p>
          <h1>Create a listing</h1>
          <p className={styles.sub}>
            Start with the basics. You can add packages, photos, and publish on the next step.
          </p>

          <form action={createListing} className={styles.form}>
            <label className={styles.field}>
              <span>Title *</span>
              <input name="title" type="text" required maxLength={140} placeholder="e.g. Podcast launch package" />
            </label>
            <label className={styles.field}>
              <span>Category</span>
              <select name="category_id" defaultValue="">
                <option value="">Choose a category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Short summary</span>
              <input name="summary" type="text" maxLength={280} placeholder="One line shown on directory cards" />
            </label>
            <label className={styles.field}>
              <span>Description</span>
              <textarea name="description" rows={6} maxLength={6000} placeholder="Describe what you offer…" />
            </label>
            <button type="submit" className="p-btn">
              Create draft
            </button>
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
}
