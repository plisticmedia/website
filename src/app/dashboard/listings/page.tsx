import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { requireUser } from "@/lib/auth";
import { getSellerServices } from "@/lib/services";
import styles from "./Listings.module.css";

export const metadata: Metadata = { title: "My listings | Plistic" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  paused: "Paused",
  removed: "Removed",
};

export default async function ListingsPage() {
  const profile = await requireUser("/dashboard/listings");
  const services = await getSellerServices(profile.id);

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.inner}`}>
          <header className={styles.head}>
            <div>
              <p className={styles.kicker}>
                <Link href="/dashboard">Dashboard</Link> / Listings
              </p>
              <h1>My listings</h1>
            </div>
            <Link href="/dashboard/listings/new" className="p-btn">
              <Plus aria-hidden="true" size={18} /> New listing
            </Link>
          </header>

          {services.length === 0 ? (
            <div className={styles.empty}>
              <p>You haven&apos;t created any listings yet.</p>
              <Link href="/dashboard/listings/new" className="p-btn">
                Create your first listing
              </Link>
            </div>
          ) : (
            <ul className={styles.list}>
              {services.map((s) => (
                <li key={s.id}>
                  <Link href={`/dashboard/listings/${s.id}`} className={styles.row}>
                    <div className={styles.rowThumb}>
                      {s.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.cover_image_url} alt="" />
                      ) : (
                        <span aria-hidden="true" />
                      )}
                    </div>
                    <div className={styles.rowMain}>
                      <strong>{s.title}</strong>
                      <span className={styles.rowMeta}>
                        {s.categories?.name ?? "Uncategorised"} · {s.service_packages.length} package(s)
                      </span>
                    </div>
                    <span className={`${styles.status} ${styles[`status_${s.status}`] ?? ""}`}>
                      {STATUS_LABEL[s.status] ?? s.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
