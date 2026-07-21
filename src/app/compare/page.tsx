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
  title: "Browse & compare services | Plistic",
  description: "Browse Scotland's creative services by category and compare prices side by side — then enquire or book.",
};
export const dynamic = "force-dynamic";

function gbp(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

const SORTS: Array<{ key: string; label: string }> = [
  { key: "price", label: "Cheapest first" },
  { key: "price_desc", label: "Most expensive" },
  { key: "rating", label: "Top rated" },
];

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; max?: string }>;
}) {
  const { category, sort, max } = await searchParams;
  const maxPrice = max && /^\d+$/.test(max) ? Number(max) : undefined;
  const activeSort = SORTS.some((s) => s.key === sort) ? (sort as string) : "price";
  const { rows, categories } = await getComparableServices(category, activeSort, maxPrice);

  // Build a /compare URL preserving the other filters.
  const urlWith = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { category, sort: activeSort === "price" ? undefined : activeSort, max, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const qs = p.toString();
    return qs ? `/compare?${qs}` : "/compare";
  };

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className="p-container">
            <p className={styles.kicker}>Marketplace</p>
            <h1>Browse &amp; compare services</h1>
            <p className={styles.lead}>
              Pick a category and see everyone in Scotland who offers it, side by side by price, delivery time and
              rating. Enquire directly — or, where a business offers it, book securely with your payment held safely
              until the work is delivered.
            </p>
          </div>
        </section>

        <section className={`p-container ${styles.body}`}>
          {categories.length > 0 && (
            <div className={styles.filters}>
              <Link href={urlWith({ category: undefined })} className={!category ? styles.chipActive : styles.chip}>
                All
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={urlWith({ category: c.slug })}
                  className={category === c.slug ? styles.chipActive : styles.chip}
                >
                  {titleCaseName(c.name)}
                </Link>
              ))}
            </div>
          )}

          <div className={styles.controls}>
            <div className={styles.sorts} aria-label="Sort">
              {SORTS.map((s) => (
                <Link
                  key={s.key}
                  href={urlWith({ sort: s.key === "price" ? undefined : s.key })}
                  className={activeSort === s.key ? styles.chipActive : styles.chip}
                >
                  {s.label}
                </Link>
              ))}
            </div>
            <form className={styles.maxForm} action="/compare" method="get">
              {category && <input type="hidden" name="category" value={category} />}
              {activeSort !== "price" && <input type="hidden" name="sort" value={activeSort} />}
              <label>
                Max £
                <input type="number" name="max" min="0" step="50" defaultValue={max ?? ""} placeholder="any" />
              </label>
              <button type="submit" className={styles.chip}>Apply</button>
              {maxPrice ? <Link href={urlWith({ max: undefined })} className={styles.clearMax}>clear</Link> : null}
            </form>
          </div>

          {rows.length === 0 ? (
            <p className={styles.empty}>
              No priced services in this category yet. Browse the full <Link href="/directory">directory</Link> to send an enquiry.
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
                            {r.bookable ? "Book" : "View & enquire"} <ArrowRight aria-hidden="true" size={15} />
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
