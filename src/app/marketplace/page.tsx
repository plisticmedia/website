import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { getMarketplaceItems } from "@/lib/marketplace";
import { ItemCard } from "./ItemCard";
import { MarketplaceFilters } from "./MarketplaceFilters";
import styles from "./Marketplace.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Marketplace | Plistic",
  description:
    "Buy directly from Scotland's creative businesses — prints, crafts, handmade goods and services from the Plistic directory.",
};

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const type = sp.type === "physical" || sp.type === "service" ? sp.type : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const { items, total, pageCount } = await getMarketplaceItems({ q: sp.q, type, page });

  function pageHref(p: number) {
    const q = new URLSearchParams();
    if (sp.q) q.set("q", sp.q);
    if (type) q.set("type", type);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `/marketplace?${s}` : "/marketplace";
  }

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className="p-container">
            <p className={styles.kicker}>Plistic Marketplace</p>
            <h1>Buy from Scotland&apos;s creatives</h1>
            <p className={styles.lead}>
              Prints, crafts, handmade goods and services — straight from the businesses in our directory. Every
              purchase supports a local creative.
            </p>
          </div>
        </section>

        <section className={`${styles.controls} p-container`}>
          <MarketplaceFilters />
        </section>

        <section className="p-container">
          <p className={styles.count}>
            {total === 0
              ? "No items yet"
              : `${total} ${total === 1 ? "item" : "items"}${sp.q ? ` for “${sp.q}”` : ""}`}
          </p>

          {items.length === 0 ? (
            <div className={styles.empty}>
              <p>Nothing here yet — the marketplace is just opening up.</p>
              <p>
                <Link href="/directory" className={styles.sellerLink}>
                  Browse the directory
                </Link>{" "}
                to find businesses, or{" "}
                <Link href="/list-your-business" className={styles.sellerLink}>
                  list your own
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className={styles.grid}>
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {pageCount > 1 && (
            <div className={styles.pager}>
              {page > 1 && <Link href={pageHref(page - 1)}>← Previous</Link>}
              {page < pageCount && <Link href={pageHref(page + 1)}>Next →</Link>}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
