import type { Metadata } from "next";
import { after } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock3, Check, ExternalLink, MapPin, Sparkles, BadgeCheck, Star, CalendarClock, Award } from "lucide-react";
import { Footer } from "@/components/Footer";
import { GoogleRating, googleReviewsUrl } from "@/components/GoogleRating";
import { SiteHeader } from "@/components/SiteHeader";
import { toDisplayImage, toEmbedUrl } from "@/lib/images";
import { CoverImage } from "../ListingImage";
import { getServiceBySlug, getServiceReviews } from "@/lib/services";
import { getConfirmedCollaborators, getPublicPeerConfidence } from "@/lib/peers";
import { getSessionProfile } from "@/lib/auth";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { EnquiryForm } from "./EnquiryForm";
import { BookButton } from "./BookButton";
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
  const title = `${service.title} | Plistic directory`;
  const description =
    service.summary ??
    `${service.title} — a creative and media business in Scotland. See their work and enquire directly in the Plistic directory.`;
  const image = toDisplayImage(service.cover_image_url, 1200) ?? toDisplayImage(service.logo_url, 1200) ?? undefined;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `/directory/${slug}`,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const gallery = [...service.service_media].sort((a, b) => a.sort_order - b.sort_order);
  const packages = [...service.service_packages].sort((a, b) => a.sort_order - b.sort_order);
  const seller = service.profiles;
  const { reviews, average: reviewAvg, count: reviewCount } = await getServiceReviews(service.id);
  const collaborators = await getConfirmedCollaborators(service.id);

  const viewer = await getSessionProfile();
  const peerConf = await getPublicPeerConfidence(service.id, !!viewer);

  // Count a public view AFTER the page has been sent, so it never adds to load
  // time. Best-effort; skip the owner and admins.
  if (viewer?.id !== service.seller_id && viewer?.role !== "admin") {
    const serviceId = service.id;
    const nextCount = (service.view_count ?? 0) + 1;
    after(async () => {
      try {
        await createSupabaseServiceRoleClient().from("services").update({ view_count: nextCount }).eq("id", serviceId);
      } catch {
        /* view counting must never break the page */
      }
    });
  }

  // Claim-a-listing: only for unowned (imported) listings.
  const isUnowned = !service.seller_id;
  const profile = isUnowned ? viewer : null;
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: service.title,
    description: service.summary ?? undefined,
    url: service.website_url ?? undefined,
    ...(service.address || service.postcode
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: service.address ?? undefined,
            postalCode: service.postcode ?? undefined,
            addressCountry: "GB",
          },
        }
      : {}),
    ...(service.latitude && service.longitude
      ? { geo: { "@type": "GeoCoordinates", latitude: service.latitude, longitude: service.longitude } }
      : {}),
    ...(service.google_rating != null && service.google_rating_count
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: service.google_rating,
            reviewCount: service.google_rating_count,
          },
        }
      : reviewAvg != null && reviewCount > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: reviewAvg,
              reviewCount,
            },
          }
        : {}),
    ...(reviews.length > 0
      ? {
          review: reviews.slice(0, 20).map((r) => ({
            "@type": "Review",
            reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
            author: { "@type": "Person", name: r.buyer_name ?? "Verified buyer" },
            ...(r.body ? { reviewBody: r.body } : {}),
            datePublished: r.created_at.slice(0, 10),
          })),
        }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.top}`}>
          {service.status !== "published" && (
            <p style={{ margin: "0 0 1rem", padding: "0.7rem 1rem", borderRadius: 10, background: "rgba(245,200,75,0.18)", border: "1px solid rgba(245,200,75,0.5)", fontSize: "0.9rem", fontWeight: 600 }}>
              👁 Preview — this listing is “{service.status}” and isn’t public yet. Only you (admin) and its owner can see this page.
            </p>
          )}
          <p className={styles.breadcrumb}>
            <Link href="/directory">← Back to directory</Link>
          </p>
          {service.is_featured && (
            <div className={styles.trustedBanner}>
              <Sparkles aria-hidden="true" size={16} /> Trusted partner — featured by Plistic
            </div>
          )}
          <div className={`${styles.header} ${service.is_featured ? styles.headerTrusted : ""}`}>
            <div>
              {(() => {
                const tags = service.listing_services
                  .map((ls) => ls.categories?.name)
                  .filter((n): n is string => !!n);
                const display = tags.length ? tags : service.categories?.name ? [service.categories.name] : [];
                return display.length ? <span className={styles.cat}>{display.join(" · ")}</span> : null;
              })()}
              {(service as { listing_type?: string }).listing_type === "individual" && (
                <span className={styles.typeBadge}>Individual · Freelancer</span>
              )}
              <h1>{service.title}</h1>
              {service.google_rating != null && (
                <p style={{ margin: "0.5rem 0 0" }}>
                  <GoogleRating
                    rating={service.google_rating}
                    count={service.google_rating_count}
                    size={16}
                    href={googleReviewsUrl(service.google_place_id)}
                  />
                </p>
              )}
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
            <div className={styles.badges}>
              {service.is_featured && (
                <span className={styles.featured}>
                  <Sparkles aria-hidden="true" size={14} /> Trusted partner
                </span>
              )}
              {service.verified && (
                <span className={styles.verified}>
                  <BadgeCheck aria-hidden="true" size={14} /> Verified
                </span>
              )}
              {service.founding && (
                <span className={styles.foundingBadge}>
                  <Star aria-hidden="true" size={14} /> Founding partner
                </span>
              )}
            </div>
          </div>
          {service.availability && (
            <p className={styles.availability}>
              <CalendarClock aria-hidden="true" size={15} /> {service.availability}
            </p>
          )}
        </section>

        <CoverImage
          src={toDisplayImage(service.cover_image_url, 1600) ?? toDisplayImage(service.logo_url, 1600)}
          alt={service.title}
          className={styles.cover}
          wrapClassName={`p-container ${styles.coverWrap}`}
        />

        <section className={`p-container ${styles.layout}`}>
          <div className={styles.main}>
            {service.description && (
              <div className={styles.prose}>
                {service.description.split(/\n{2,}/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            )}

            {service.credits && (
              <div className={styles.credits}>
                <h2><Award aria-hidden="true" size={18} /> Notable work &amp; credits</h2>
                {service.credits.split(/\n+/).filter(Boolean).map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )}

            {gallery.length > 0 && (
              <div className={styles.gallery} aria-label="Portfolio samples">
                {gallery.map((m) => {
                  const embed = m.kind === "embed" ? toEmbedUrl(m.url) : null;
                  if (embed) {
                    return (
                      <div key={m.id} className={styles.galleryEmbed}>
                        <iframe
                          src={embed}
                          title="Showreel"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    );
                  }
                  return m.kind === "video" ? (
                    <video key={m.id} src={m.url} controls className={styles.galleryItem} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={m.id} src={m.url} alt="" loading="lazy" className={styles.galleryItem} />
                  );
                })}
              </div>
            )}

            {packages.length > 0 && (
              <div className={styles.packages}>
                <h2>Packages</h2>
                <p className={styles.packagesNote}>
                  {packages.some((p) => p.is_bookable && p.price_gbp != null && p.price_gbp > 0 && !!seller?.payouts_enabled)
                    ? "Book securely through Plistic — your payment is held safely and released once the work is delivered."
                    : "Indicative pricing — confirm details directly with the seller."}
                </p>
                <div className={styles.packageGrid}>
                  {packages.map((p) => {
                    const bookable = p.is_bookable && p.price_gbp != null && p.price_gbp > 0 && !!seller?.payouts_enabled;
                    return (
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
                        {bookable && <BookButton packageId={p.id} priceLabel={gbp(p.price_gbp) ?? ""} />}
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            {reviewCount > 0 && (
              <div className={styles.reviews}>
                <h2>
                  Reviews{" "}
                  <span className={styles.reviewsAvg}>
                    ★ {reviewAvg} · {reviewCount} verified {reviewCount === 1 ? "review" : "reviews"}
                  </span>
                </h2>
                <p className={styles.reviewsNote}>From buyers who booked through Plistic.</p>
                <ul className={styles.reviewList}>
                  {reviews.map((r) => (
                    <li key={r.id} className={styles.review}>
                      <div className={styles.reviewStars} aria-label={`${r.rating} out of 5`}>
                        {"★".repeat(r.rating)}
                        <span className={styles.reviewStarsOff}>{"★".repeat(5 - r.rating)}</span>
                      </div>
                      {r.body && <p className={styles.reviewBody}>{r.body}</p>}
                      <p className={styles.reviewMeta}>
                        {r.buyer_name ?? "Verified buyer"} · {new Date(r.created_at).toLocaleDateString("en-GB")}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {collaborators.length > 0 && (
              <div className={styles.workedWith}>
                <h2>Worked with</h2>
                <p className={styles.workedWithNote}>Confirmed collaborations across Scotland&apos;s creative scene.</p>
                <ul className={styles.workedWithList}>
                  {collaborators.map((c) => (
                    <li key={c.id}>
                      <Link href={`/directory/${c.slug}`} className={styles.workedWithChip}>
                        {c.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.logo_url} alt="" />
                        ) : (
                          <span className={styles.workedWithInitial} aria-hidden="true">{c.title.charAt(0)}</span>
                        )}
                        {c.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {peerConf && (
              <div className={styles.peerConf}>
                <h2>Peer confidence</h2>
                <p className={styles.peerConfNote}>
                  Aggregated, anonymous feedback from {peerConf.confidence.count} businesses who&apos;ve worked with them.
                  Visible to signed-in businesses.
                </p>
                <div className={styles.peerConfStats}>
                  <div className={styles.peerConfStat}>
                    <strong>{peerConf.confidence.wouldAgainPct}%</strong>
                    <span>would work with them again</span>
                  </div>
                  {peerConf.confidence.reliability != null && (
                    <div className={styles.peerConfStat}><strong>{peerConf.confidence.reliability}</strong><span>reliability</span></div>
                  )}
                  {peerConf.confidence.communication != null && (
                    <div className={styles.peerConfStat}><strong>{peerConf.confidence.communication}</strong><span>communication</span></div>
                  )}
                  {peerConf.confidence.quality != null && (
                    <div className={styles.peerConfStat}><strong>{peerConf.confidence.quality}</strong><span>quality</span></div>
                  )}
                </div>
                {peerConf.reply && (
                  <p className={styles.peerConfReply}>
                    <strong>{service.title} responds:</strong> {peerConf.reply}
                  </p>
                )}
              </div>
            )}
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.enquiryCard}>
              <h2>Enquire</h2>
              <p>Send a message to {seller?.display_name ?? "this partner"}. They&apos;ll reply to you directly.</p>
              {service.booking_url && (
                <a
                  className={`p-btn ${styles.bookCallBtn}`}
                  href={service.booking_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                >
                  <CalendarClock aria-hidden="true" size={18} /> Book a call
                </a>
              )}
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
                  {socials.map(([net, href]) => {
                    const label = ({ youtube: "YouTube", vimeo: "Vimeo", tiktok: "TikTok", linkedin: "LinkedIn", instagram: "Instagram" } as Record<string, string>)[net] ?? net;
                    return (
                      <a key={net} href={href} target="_blank" rel="noopener noreferrer nofollow" style={{ display: "block", marginTop: "0.4rem", textTransform: "capitalize" }}>
                        {label}
                      </a>
                    );
                  })}
                </div>
              );
            })()}
            {isUnowned && (
              <div className={styles.sellerCard}>
                <h3>Is this your business?</h3>
                {service.claim_token ? (
                  <>
                    <p>Claim it to edit your profile, add a showreel and photos, and get enquiries — free.</p>
                    <Link href={`/claim/${service.claim_token}`} className={`p-btn ${styles.enquireBtn}`}>
                      Claim this listing
                    </Link>
                  </>
                ) : claimState === "guest" ? (
                  <>
                    <p>Sign in to claim this listing and manage it yourself.</p>
                    <Link href={`/login?next=${encodeURIComponent(`/directory/${slug}`)}`}>Sign in to claim →</Link>
                  </>
                ) : claimState === "pending" ? (
                  <p>Your claim is pending review. We&apos;ll email you once it&apos;s approved.</p>
                ) : (
                  <form action={requestClaim.bind(null, service.id, slug)} className={styles.enquiryForm}>
                    <p style={{ margin: 0 }}>Claim it to edit the details and respond to enquiries.</p>
                    <label className={styles.field}>
                      <span>Proof (e.g. your work email or role)</span>
                      <input name="evidence" type="text" maxLength={200} placeholder="you@yourbusiness.com" />
                    </label>
                    <button type="submit" className={`p-btn ${styles.enquireBtn}`}>Claim this listing</button>
                  </form>
                )}
                {service.source && (
                  <p style={{ marginTop: "0.7rem", fontSize: "0.78rem", color: "var(--p-muted)" }}>
                    Compiled from public business information. <Link href={`/claim/${service.claim_token ?? ""}`}>Claim or request removal</Link>.
                  </p>
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
