import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { getCategories, getServiceDensity } from "@/lib/services";
import { DensityMapSection } from "../DensityMapSection";
import styles from "../Directory.module.css";

export const metadata: Metadata = {
  title: "Where Scotland's creative ecosystem clusters | Plistic",
  description: "A density map of media and creative companies across Scotland, by service.",
};

export const dynamic = "force-dynamic";

export default async function DensityPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const [points, categories] = await Promise.all([
    getServiceDensity(params.category),
    getCategories(),
  ]);

  const href = (category?: string) => (category ? `/directory/density?category=${category}` : "/directory/density");

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className="p-container">
            <p className={styles.kicker}>Ecosystem map</p>
            <h1>
              Where Scotland&apos;s <span>creative ecosystem</span> clusters.
            </h1>
            <p className={styles.lead}>
              Each circle shows how many companies work in that area — bigger means denser. Filter by service to
              see where different disciplines concentrate.
            </p>
            <p style={{ marginTop: "1rem" }}>
              <Link href="/directory" style={{ color: "var(--p-white)", fontWeight: 600 }}>
                ← Back to the directory
              </Link>
            </p>
          </div>
        </section>

        <section className={`p-container ${styles.body}`}>
          <p className={styles.filterLabel}>Service</p>
          <nav className={styles.filters} aria-label="Filter density by service">
            <Link href={href()} className={!params.category ? styles.chipActive : styles.chip}>
              All services
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={href(c.slug)}
                className={params.category === c.slug ? styles.chipActive : styles.chip}
              >
                {c.name}
              </Link>
            ))}
          </nav>

          <div className={styles.mapWrap}>
            <DensityMapSection points={points} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
