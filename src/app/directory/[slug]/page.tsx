import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock3, Check, ExternalLink, MapPin, Sparkles } from "lucide-react";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { getServiceBySlug } from "@/lib/services";
import { getSessionProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EnquiryForm } from "./EnquiryForm";
import { requestClaim } from "./actions";
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

  // Claim-a-listing: only for unowned (imported) listings.
  const isUnowned = !service.seller_id;
  const profile = isUnowned ? await getSessionProfile() : null;
  let claimState: "none" | "guest" | "pending" = "none";
  if (isUnowned) {
    if (!profile) {
      claimState = "guest";
    } else {
      const supabase = await createSupabaseServerClient();
      const { data: myClaim } = await supabase
        .from("claims")
        .select("status")
        .eq("service_id", service.id)
        .eq("claimant_user_id", profile.id)
        .eq("status", "pending")
        .maybeSingle();
      claimState = myClaim ? "pending" : "none";
    }
  }

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
              {(() => {
                const tags = service.listing_services
                  .map((ls) => ls.categories?.name)
                  .filter((n): n is string => !!n);
                const display = tags.length ? tags : service.categories?.name ? [service.categories.name] : [];
                return display.length ? <span className={styles.cat}>{display.join(" · ")}</span> : null;
              })()}
              <h1>{service.title}</h1>
              {service.summary && <p className={styles.summary}>{service.summary}</p>}
              <p className={styles.by}>
                {seller?.display_name ? (
                  <>by <strong>{seller.display_name}</strong></>
                ) : null}
                {(() => {
                  const areas = service.service_areas
                    .map((sa) => sa.locations?.name)
                    .filter((n): n is string => !!n);
                  if (areas.length === 0) return null;
                  return (
                    <span className={styles.metaLoc}>
                      <MapPin aria-hidden="true" size={14} /> Covers {areas.slice(0, 4).join(", ")}
                    </span>
                  );
                })()}
              </p>
              {(service.address || service.postcode) && (
                <p className={styles.metaLoc} style={{ marginTop: "0.5rem", color: "var(--p-muted)" }}>
                  <MapPin aria-hidden="true" size={14} />{" "}
                  {[service.address, service.postcode].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
            {service.is_featured && (
              <span className={styles.featured}>
                <Sparkles aria-hidden="true" size={14} /> Trusted partner
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
            {(() => {
              const website = service.website_url ?? seller?.website_url ?? null;
              const socials = Object.entries(service.social_links ?? {}).filter(([, v]) => !!v);
              if (!website && socials.length === 0) return null;
              return (
                <div className={styles.sellerCard}>
                  <h3>Links</h3>
                  {website && (
                    <a href={website} target="_blank" rel="noopener noreferrer nofollow">
                      <ExternalLink aria-hidden="true" size={14} /> Visit website
                    </a>
                  )}
                  {socials.map(([net, href]) => (
                    <a key={net} href={href} target="_blank" rel="noopener noreferrer nofollow" style={{ display: "block", marginTop: "0.4rem", textTransform: "capitalize" }}>
                      {net}
                    </a>
                  ))}
                </div>
              );
            })()}
            {isUnowned && (
              <div className={styles.sellerCard}>
                <h3>Is this your business?</h3>
                {claimState === "guest" && (
                  <>
                    <p>Sign in to claim this listing and manage it yourself.</p>
                    <Link href={`/login?next=${encodeURIComponent(`/directory/${slug}`)}`}>
                      Sign in to claim →
                    </Link>
                  </>
                )}
                {claimState === "pending" && (
                  <p>Your claim is pending review. We&apos;ll email you once it&apos;s approved.</p>
                )}
                {claimState === "none" && (
                  <form action={requestClaim.bind(null, service.id, slug)} className={styles.enquiryForm}>
                    <p style={{ margin: 0 }}>Claim it to edit the details and respond to enquiries.</p>
                    <label className={styles.field}>
                      <span>Proof (e.g. your work email or role)</span>
                      <input name="evidence" type="text" maxLength={200} placeholder="you@yourbusiness.com" />
                    </label>
                    <button type="submit" className={`p-btn ${styles.enquireBtn}`}>
                      Claim this listing
                    </button>
                  </form>
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
