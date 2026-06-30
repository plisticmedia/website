import type { Metadata } from "next";
import Link from "next/link";
import { Search, Sparkles } from "lucide-react";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { getCategories, getPublishedServices } from "@/lib/services";
import styles from "./Directory.module.css";

export const metadata: Metadata = {
  title: "Find a creative partner | Plistic directory",
  description:
    "Browse Plistic's directory of trusted Scottish media and creative partners — podcasting, video, photography, PR and more.",
};

export const dynamic = "force-dynamic";

function gbp(value: number | null) {
  if (value == null) return null;
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
}

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const [{ services, pageCount }, categories] = await Promise.all([
    getPublishedServices({ q: params.q, category: params.category, page }),
    getCategories(),
  ]);

  const buildHref = (next: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    const merged = { q: params.q, category: params.category, page, ...next };
    Object.entries(merged).forEach(([k, v]) => {
      if (v !== undefined && v !== "" && !(k === "page" && v === 1)) sp.set(k, String(v));
    });
    const qs = sp.toString();
    return qs ? `/directory?${qs}` : "/directory";
  };

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className="p-container">
            <p className={styles.kicker}>Partner directory</p>
            <h1>
              Find a trusted <span>creative partner</span>.
            </h1>
            <p className={styles.lead}>
              Browse independent media and creative specialists. Found a fit? Send an enquiry — you deal with
              them directly.
            </p>

            <form className={styles.searchBar} action="/directory" method="get">
              {params.category && <input type="hidden" name="category" value={params.category} />}
              <div className={styles.searchInput}>
                <Search aria-hidden="true" size={18} />
                <input
                  type="search"
                  name="q"
                  placeholder="Search by name or service…"
                  defaultValue={params.q ?? ""}
                  aria-label="Search the directory"
                />
              </div>
              <button type="submit" className="p-btn">
                Search
              </button>
            </form>
          </div>
        </section>

        <section className={`p-container ${styles.body}`}>
          <nav className={styles.filters} aria-label="Filter by category">
            <Link href={buildHref({ category: undefined, page: 1 })} className={!params.category ? styles.chipActive : styles.chip}>
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={buildHref({ category: c.slug, page: 1 })}
                className={params.category === c.slug ? styles.chipActive : styles.chip}
              >
                {c.name}
              </Link>
            ))}
          </nav>

          {services.length === 0 ? (
            <p className={styles.empty}>No listings match yet. Try a different search or category.</p>
          ) : (
            <ul className={styles.grid}>
              {services.map((s) => {
                const fromPrice = s.service_packages
                  .map((p) => p.price_gbp)
                  .filter((p): p is number => p != null)
                  .sort((a, b) => a - b)[0];
                return (
                  <li key={s.id}>
                    <Link href={`/directory/${s.slug}`} className={styles.card}>
                      <div className={styles.cardImage}>
                        {s.cover_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.cover_image_url} alt="" loading="lazy" />
                        ) : (
                          <span className={styles.cardImagePlaceholder} aria-hidden="true" />
                        )}
                        {s.is_featured && (
                          <span className={styles.featured}>
                            <Sparkles aria-hidden="true" size={13} /> Featured
                          </span>
                        )}
                      </div>
                      <div className={styles.cardBody}>
                        {s.categories?.name && <span className={styles.cardCat}>{s.categories.name}</span>}
                        <h2>{s.title}</h2>
                        {s.summary && <p>{s.summary}</p>}
                        <div className={styles.cardFoot}>
                          <span>{s.profiles?.display_name ?? "Plistic partner"}</span>
                          {fromPrice != null && <span className={styles.price}>from {gbp(fromPrice)}</span>}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {pageCount > 1 && (
            <nav className={styles.pagination} aria-label="Pagination">
              {page > 1 && <Link href={buildHref({ page: page - 1 })}>← Previous</Link>}
              <span>
                Page {page} of {pageCount}
              </span>
              {page < pageCount && <Link href={buildHref({ page: page + 1 })}>Next →</Link>}
            </nav>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
