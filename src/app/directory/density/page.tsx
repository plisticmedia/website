import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { getCategories, getMapPoints, getUnlocatedServices } from "@/lib/services";
import { MapSection } from "../MapSection";
import { RemotePanel } from "../RemotePanel";
import styles from "../Directory.module.css";

export const metadata: Metadata = {
  title: "Map of Scotland's creative ecosystem | Plistic",
  description: "An interactive map of media and creative companies across Scotland, by service and location.",
};

export const dynamic = "force-dynamic";

export default async function DensityPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const filters = { category: params.category };
  const [points, unlocated, categories] = await Promise.all([
    getMapPoints(filters),
    getUnlocatedServices(filters),
    getCategories(),
  ]);

  const href = (category?: string) => (category ? `/directory/density?category=${category}` : "/directory/density");
  const total = points.length + unlocated.length;

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className="p-container">
            <p className={styles.kicker}>Ecosystem map</p>
            <h1>
              Scotland&apos;s <span>creative ecosystem</span>, on the map.
            </h1>
            <p className={styles.lead}>
              Each circle groups nearby businesses and shows how many there are. Zoom into an area and the circles
              split into individual pins — click one to see the business and its address. Filter by service to see
              where different disciplines cluster.
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
          <nav className={styles.filters} aria-label="Filter map by service">
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

          <p className={styles.resultCount} aria-live="polite">
            {total} {total === 1 ? "business" : "businesses"}
            {points.length > 0 ? ` · ${points.length} pinned` : ""}
            {unlocated.length > 0 ? ` · ${unlocated.length} Scotland-wide/remote` : ""}
          </p>

          {points.length === 0 && unlocated.length === 0 ? (
            <p className={styles.empty}>
              No businesses to map yet for this filter. Add listings (and their addresses) via the listing editor or
              import.
            </p>
          ) : (
            <div className={`${styles.mapLayout} ${points.length > 0 && unlocated.length > 0 ? styles.withPanel : ""}`}>
              {points.length > 0 ? (
                <MapSection points={points} height={560} />
              ) : (
                <p className={styles.empty} style={{ padding: "2rem 0" }}>
                  No businesses with a fixed address for this filter — see the Scotland-wide list.
                </p>
              )}
              <RemotePanel items={unlocated} />
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
