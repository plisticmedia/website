import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock3, Check, Sparkles } from "lucide-react";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { getServiceBySlug } from "@/lib/services";
import { EnquiryForm } from "./EnquiryForm";
import styles from "./Listing.module.css";

export const dynamic = "force-dynamic";

function gbp(value: number | null) {
  if (value == null) return null;
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return { title: "Listing not found | Plistic" };
  return {
    title: `${service.title} | Plistic directory`,
    description: service.summary ?? undefined,
  };
}

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const gallery = [...service.service_media].sort((a, b) => a.sort_order - b.sort_order);
  const packages = [...service.service_packages].sort((a, b) => a.sort_order - b.sort_order);
  const seller = service.profiles;

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.top}`}>
          <p className={styles.breadcrumb}>
            <Link href="/directory">← Back to directory</Link>
          </p>
          <div className={styles.header}>
            <div>
              {service.categories?.name && <span className={styles.cat}>{service.categories.name}</span>}
              <h1>{service.title}</h1>
              {service.summary && <p className={styles.summary}>{service.summary}</p>}
              <p className={styles.by}>
                by <strong>{seller?.display_name ?? "Plistic partner"}</strong>
              </p>
            </div>
            {service.is_featured && (
              <span className={styles.featured}>
                <Sparkles aria-hidden="true" size={14} /> Featured partner
              </span>
            )}
          </div>
        </section>

        {service.cover_image_url && (
          <section className={`p-container ${styles.coverWrap}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.cover} src={service.cover_image_url} alt={service.title} />
          </section>
        )}

        <section className={`p-container ${styles.layout}`}>
          <div className={styles.main}>
            {service.description && (
              <div className={styles.prose}>
                {service.description.split(/\n{2,}/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            )}

            {gallery.length > 0 && (
              <div className={styles.gallery} aria-label="Portfolio samples">
                {gallery.map((m) =>
                  m.kind === "video" ? (
                    <video key={m.id} src={m.url} controls className={styles.galleryItem} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={m.id} src={m.url} alt="" loading="lazy" className={styles.galleryItem} />
                  ),
                )}
              </div>
            )}

            {packages.length > 0 && (
              <div className={styles.packages}>
                <h2>Packages</h2>
                <p className={styles.packagesNote}>Indicative pricing — confirm details directly with the seller.</p>
                <div className={styles.packageGrid}>
                  {packages.map((p) => (
                    <article key={p.id} className={styles.package}>
                      <h3>{p.name}</h3>
                      {p.price_gbp != null && <p className={styles.packagePrice}>{gbp(p.price_gbp)}</p>}
                      {p.delivery_days != null && (
                        <p className={styles.packageMeta}>
                          <Clock3 aria-hidden="true" size={14} /> {p.delivery_days} day delivery
                        </p>
                      )}
                      {p.features.length > 0 && (
                        <ul>
                          {p.features.map((f, i) => (
                            <li key={i}>
                              <Check aria-hidden="true" size={14} /> {f}
                            </li>
                          ))}
                        </ul>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.enquiryCard}>
              <h2>Enquire</h2>
              <p>Send a message to {seller?.display_name ?? "this partner"}. They&apos;ll reply to you directly.</p>
              <EnquiryForm serviceId={service.id} serviceTitle={service.title} />
            </div>
            {(seller?.bio || seller?.website_url) && (
              <div className={styles.sellerCard}>
                <h3>About {seller?.display_name ?? "the seller"}</h3>
                {seller?.bio && <p>{seller.bio}</p>}
                {seller?.website_url && (
                  <a href={seller.website_url} target="_blank" rel="noopener noreferrer nofollow">
                    Visit website →
                  </a>
                )}
              </div>
            )}
            <p className={styles.disclaimer}>
              Plistic introduces buyers and sellers but is not a party to any agreement between them.
            </p>
          </aside>
        </section>
      </main>
      <Footer />
    </>
  );
}
