import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3, Star } from "lucide-react";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { getComparableServices } from "@/lib/services";
import { toDisplayImage, initialOf } from "@/lib/images";
import { titleCaseName } from "@/lib/format";
import styles from "./Compare.module.css";

export const metadata: Metadata = {
  title: "Compare services | Plistic",
  description: "Compare bookable creative services in Scotland side by side — price, delivery time and rating.",
};
export const dynamic = "force-dynamic";

function gbp(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const { rows, categories } = await getComparableServices(category);

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className="p-container">
            <p className={styles.kicker}>Marketplace</p>
            <h1>Compare bookable services</h1>
            <p className={styles.lead}>
              Shop around Scotland&apos;s creative talent — compare price, delivery time and rating, then book securely
              through Plistic with your payment held safely until the work is delivered.
            </p>
          </div>
        </section>

        <section className={`p-container ${styles.body}`}>
          {categories.length > 0 && (
            <div className={styles.filters}>
              <Link href="/compare" className={!category ? styles.chipActive : styles.chip}>
                All
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/compare?category=${c.slug}`}
                  className={category === c.slug ? styles.chipActive : styles.chip}
                >
                  {titleCaseName(c.name)}
                </Link>
              ))}
            </div>
          )}

          {rows.length === 0 ? (
            <p className={styles.empty}>
              No bookable services here yet. Browse the full <Link href="/directory">directory</Link> to send an enquiry.
            </p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Category</th>
                    <th>From</th>
                    <th>Delivery</th>
                    <th>Rating</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const logo = toDisplayImage(r.logo_url);
                    return (
                      <tr key={r.slug}>
                        <td>
                          <Link href={`/directory/${r.slug}`} className={styles.nameCell}>
                            <span className={styles.logo} aria-hidden="true">
                              {logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={logo} alt="" />
                              ) : (
                                <span className={styles.logoInitial}>{initialOf(r.title)}</span>
                              )}
                            </span>
                            <span className={styles.name}>
                              {r.title}
                              {r.isFeatured && <span className={styles.featured}>Featured</span>}
                            </span>
                          </Link>
                        </td>
                        <td>{r.category ? titleCaseName(r.category) : "—"}</td>
                        <td className={styles.price}>{gbp(r.fromPrice)}</td>
                        <td>
                          {r.deliveryDays ? (
                            <span className={styles.delivery}>
                              <Clock3 aria-hidden="true" size={14} /> {r.deliveryDays} day{r.deliveryDays === 1 ? "" : "s"}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          {r.rating != null ? (
                            <span className={styles.rating}>
                              <Star aria-hidden="true" size={14} /> {r.rating.toFixed(1)}
                              {r.ratingCount ? <small> ({r.ratingCount})</small> : null}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          <Link href={`/directory/${r.slug}`} className={styles.viewBtn}>
                            View <ArrowRight aria-hidden="true" size={15} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
