import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { requireUser } from "@/lib/auth";
import { getCategories, getLocations, getSellerServiceById } from "@/lib/services";
import { getListingInsights } from "@/lib/insights";
import {
  addPackage,
  deleteListing,
  deleteMedia,
  deletePackage,
  removeLogo,
  setListingStatus,
  setPackageBookable,
  updateListing,
} from "../actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PhotoUploader } from "./PhotoUploader";
import { LogoUploader } from "./LogoUploader";
import { VideoEmbedForm } from "./VideoEmbedForm";
import styles from "../Listings.module.css";

export const metadata: Metadata = { title: "Edit listing | Plistic" };
export const dynamic = "force-dynamic";

function gbp(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
}

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireUser(`/dashboard/listings/${id}`);
  const [service, categories, locations] = await Promise.all([
    getSellerServiceById(profile.id, id),
    getCategories(),
    getLocations(),
  ]);
  if (!service) notFound();

  const insights = await getListingInsights(service.id);
  const gbp0 = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
  const pricingLabel = insights.pricing
    ? insights.pricing.position === "below"
      ? "Below most in your category"
      : insights.pricing.position === "above"
        ? "Above most in your category"
        : "Around the middle for your category"
    : null;

  const isPublished = service.status === "published";
  const selectedSlugs = new Set(
    service.listing_services.map((ls) => ls.categories?.slug).filter(Boolean),
  );
  const selectedAreaSlugs = new Set(
    service.service_areas.map((sa) => sa.locations?.slug).filter(Boolean),
  );
  const social = service.social_links ?? {};
  const packages = [...service.service_packages].sort((a, b) => a.sort_order - b.sort_order);
  const media = [...service.service_media].sort((a, b) => a.sort_order - b.sort_order);
  const photos = media.filter((m) => m.kind === "image");
  const showreels = media.filter((m) => m.kind === "embed" || m.kind === "video");

  // Bookable packages need a payout account; gate the option on that.
  const supabase = await createSupabaseServerClient();
  const { data: prof } = await supabase.from("profiles").select("payouts_enabled").eq("id", profile.id).maybeSingle();
  const payoutsReady = !!prof?.payouts_enabled;

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.innerNarrow}`}>
          <p className={styles.kicker}>
            <Link href="/dashboard/listings">My listings</Link> / Edit
          </p>

          <div className={styles.editHead}>
            <h1>{service.title}</h1>
            <div className={styles.editActions}>
              <span className={`${styles.status} ${styles[`status_${service.status}`] ?? ""}`}>{service.status}</span>
              {isPublished ? (
                <form action={setListingStatus.bind(null, service.id, "paused")}>
                  <button type="submit" className="p-btn p-btn--ghost">Unpublish</button>
                </form>
              ) : service.status === "pending" ? (
                <span className={styles.reviewNote}>In review — Plistic will approve it shortly.</span>
              ) : (
                <form action={setListingStatus.bind(null, service.id, "pending")}>
                  <button type="submit" className="p-btn">Submit for review</button>
                </form>
              )}
              {isPublished && (
                <Link href={`/directory/${service.slug}`} className={styles.viewLink} target="_blank">
                  View <ExternalLink aria-hidden="true" size={14} />
                </Link>
              )}
            </div>
          </div>

          {/* Insights */}
          <div className={styles.insights}>
            <div className={styles.insightStat}>
              <strong>{insights.views}</strong>
              <span>page views{insights.views30d > 0 ? ` · ${insights.views30d} in 30 days` : ""}</span>
            </div>
            <div className={styles.insightStat}>
              <strong>{insights.enquiries}</strong>
              <span>enquir{insights.enquiries === 1 ? "y" : "ies"}</span>
            </div>
            {insights.pricing ? (
              <div className={styles.insightStat}>
                <strong>{pricingLabel}</strong>
                <span>your {gbp0(insights.pricing.yourPrice)} vs {gbp0(insights.pricing.median)} typical ({insights.pricing.sampleSize} similar)</span>
              </div>
            ) : (
              <div className={styles.insightStat}>
                <strong>Pricing insight soon</strong>
                <span>add priced packages — we&apos;ll show how you compare once there&apos;s enough data</span>
              </div>
            )}
          </div>

          {/* Details */}
          <form action={updateListing.bind(null, service.id)} className={styles.form}>
            <h2 className={styles.sectionTitle}>Details</h2>
            <label className={styles.field}>
              <span>Title *</span>
              <input name="title" type="text" required maxLength={140} defaultValue={service.title} />
            </label>
            <label className={styles.field}>
              <span>Business or individual?</span>
              <select name="listing_type" defaultValue={(service as { listing_type?: string }).listing_type ?? "business"}>
                <option value="business">A business or organisation</option>
                <option value="individual">An individual / freelancer</option>
              </select>
            </label>
            <fieldset className={styles.field} style={{ border: "none", padding: 0, margin: 0 }}>
              <span>Services offered</span>
              <div className={styles.checkGrid}>
                {categories.map((c) => (
                  <label key={c.id} className={styles.checkItem}>
                    <input
                      type="checkbox"
                      name="services"
                      value={c.id}
                      defaultChecked={selectedSlugs.has(c.slug)}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className={styles.field} style={{ border: "none", padding: 0, margin: 0 }}>
              <span>Areas you cover (for the location filter)</span>
              <div className={styles.checkGrid}>
                {locations.map((l) => (
                  <label key={l.id} className={styles.checkItem}>
                    <input
                      type="checkbox"
                      name="areas"
                      value={l.id}
                      defaultChecked={selectedAreaSlugs.has(l.slug)}
                    />
                    {l.name}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className={styles.field}>
              <span>Short summary</span>
              <input name="summary" type="text" maxLength={280} defaultValue={service.summary ?? ""} />
            </label>
            <label className={styles.field}>
              <span>Description</span>
              <textarea name="description" rows={6} maxLength={6000} defaultValue={service.description ?? ""} />
            </label>
            <label className={styles.field}>
              <span>Notable work / credits</span>
              <textarea name="credits" rows={3} maxLength={2000} defaultValue={service.credits ?? ""} placeholder="e.g. BBC Scotland, Celtic Connections, brand films for…" />
            </label>
            <label className={styles.field}>
              <span>Availability</span>
              <input name="availability" type="text" maxLength={400} defaultValue={service.availability ?? ""} placeholder="e.g. Booking from August, open to short-notice work" />
            </label>
            <label className={styles.field}>
              <span>Website</span>
              <input name="website_url" type="text" maxLength={300} defaultValue={service.website_url ?? ""} placeholder="yourstudio.com" />
            </label>
            <label className={styles.field}>
              <span>Booking link (optional)</span>
              <input name="booking_url" type="text" maxLength={300} defaultValue={service.booking_url ?? ""} placeholder="Cal.com or Calendly link — adds a “Book a call” button" />
            </label>
            <div className={styles.packageFields}>
              <label className={styles.field}>
                <span>Address or town (map pin)</span>
                <input name="address" type="text" maxLength={240} defaultValue={service.address ?? ""} placeholder="e.g. Glasgow, or a full address" />
              </label>
              <label className={styles.field}>
                <span>Postcode (most precise pin)</span>
                <input name="postcode" type="text" maxLength={20} defaultValue={service.postcode ?? ""} />
              </label>
            </div>
            <div className={styles.packageFields}>
              <label className={styles.field}>
                <span>Instagram</span>
                <input name="instagram" type="text" maxLength={200} defaultValue={social.instagram ?? ""} placeholder="https://instagram.com/…" />
              </label>
              <label className={styles.field}>
                <span>LinkedIn</span>
                <input name="linkedin" type="text" maxLength={200} defaultValue={social.linkedin ?? ""} placeholder="https://linkedin.com/…" />
              </label>
              <label className={styles.field}>
                <span>YouTube</span>
                <input name="youtube" type="text" maxLength={200} defaultValue={social.youtube ?? ""} placeholder="https://youtube.com/@yourchannel" />
              </label>
              <label className={styles.field}>
                <span>Vimeo</span>
                <input name="vimeo" type="text" maxLength={200} defaultValue={social.vimeo ?? ""} placeholder="https://vimeo.com/yourchannel" />
              </label>
              <label className={styles.field}>
                <span>TikTok</span>
                <input name="tiktok" type="text" maxLength={200} defaultValue={social.tiktok ?? ""} placeholder="https://tiktok.com/@yourhandle" />
              </label>
            </div>
            {/* Keep the primary single-category in sync for legacy fallback. */}
            <input type="hidden" name="category_id" value={service.category_id ?? ""} />
            <button type="submit" className="p-btn">Save details</button>
          </form>

          {/* Logo */}
          <div className={styles.block}>
            <h2 className={styles.sectionTitle}>Logo</h2>
            <p className={styles.sub}>Shown on your directory card and at the top of your profile. A square or wide logo on a transparent/white background works best. JPG, PNG or WebP.</p>
            {service.logo_url && (
              <div className={styles.logoPreview}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={service.logo_url} alt={`${service.title} logo`} />
                <form action={removeLogo.bind(null, service.id)}>
                  <button type="submit" className="p-btn p-btn--ghost">Remove logo</button>
                </form>
              </div>
            )}
            <LogoUploader serviceId={service.id} hasLogo={!!service.logo_url} />
          </div>

          {/* Media */}
          <div className={styles.block}>
            <h2 className={styles.sectionTitle}>Photos</h2>
            <p className={styles.sub}>Showcase your work — select several at once. The first image becomes your cover. Big photos straight off your phone are fine; we resize them for you automatically.</p>
            {photos.length > 0 && (
              <div className={styles.mediaGrid}>
                {photos.map((m) => (
                  <div key={m.id} className={styles.mediaItem}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt="" />
                    <form action={deleteMedia.bind(null, m.id, service.id)}>
                      <button type="submit" aria-label="Remove photo" className={styles.mediaDelete}>
                        <Trash2 aria-hidden="true" size={15} />
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
            <PhotoUploader serviceId={service.id} />
          </div>

          {/* Showreel / video */}
          <div className={styles.block}>
            <h2 className={styles.sectionTitle}>Showreel &amp; video</h2>
            <p className={styles.sub}>Paste a YouTube, Vimeo or Google Drive link — or a direct link to an <strong>.mp4</strong> video file — and it plays right on your profile. For a Google Drive video, set its sharing to <strong>&ldquo;Anyone with the link&rdquo;</strong> first, or it won&apos;t play for visitors.</p>
            {showreels.length > 0 && (
              <ul className={styles.packageList}>
                {showreels.map((m) => (
                  <li key={m.id}>
                    <a href={m.url} target="_blank" rel="noopener noreferrer">{m.url}</a>
                    <form action={deleteMedia.bind(null, m.id, service.id)}>
                      <button type="submit" aria-label="Remove video" className={styles.mediaDelete}>
                        <Trash2 aria-hidden="true" size={15} />
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            <VideoEmbedForm serviceId={service.id} />
          </div>

          {/* Packages */}
          <div className={styles.block}>
            <h2 className={styles.sectionTitle}>Packages</h2>
            <p className={styles.sub}>
              Set out your pricing tiers. Mark a package &quot;bookable&quot; to accept secure payment through
              Plistic — the money is held until you deliver, then paid out to you (minus commission).{" "}
              {!payoutsReady && (
                <>
                  To turn on bookings, <Link href="/dashboard/payouts">connect a payout account</Link> first.
                </>
              )}
            </p>
            {packages.length > 0 && (
              <ul className={styles.packageList}>
                {packages.map((p) => (
                  <li key={p.id}>
                    <div>
                      <strong>{p.name}</strong> — {gbp(p.price_gbp)}
                      {p.delivery_days != null && <span className={styles.rowMeta}> · {p.delivery_days} days</span>}
                      {p.is_bookable && <span className={styles.bookableTag}>Bookable online</span>}
                      {p.features.length > 0 && <div className={styles.rowMeta}>{p.features.join(", ")}</div>}
                      {(payoutsReady || p.is_bookable) && p.price_gbp != null && p.price_gbp > 0 && (
                        <form action={setPackageBookable.bind(null, p.id, service.id, !p.is_bookable)}>
                          <button type="submit" className={styles.linkBtn}>
                            {p.is_bookable ? "Turn off online booking" : "Make bookable online"}
                          </button>
                        </form>
                      )}
                    </div>
                    <form action={deletePackage.bind(null, p.id, service.id)}>
                      <button type="submit" aria-label="Delete package" className={styles.mediaDelete}>
                        <Trash2 aria-hidden="true" size={15} />
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            <form action={addPackage.bind(null, service.id)} className={styles.form}>
              <div className={styles.packageFields}>
                <label className={styles.field}>
                  <span>Name *</span>
                  <input name="name" type="text" required maxLength={120} placeholder="Standard" />
                </label>
                <label className={styles.field}>
                  <span>Price (GBP)</span>
                  <input name="price_gbp" type="number" min="0" step="1" placeholder="750" />
                </label>
                <label className={styles.field}>
                  <span>Delivery (days)</span>
                  <input name="delivery_days" type="number" min="0" step="1" placeholder="14" />
                </label>
              </div>
              <label className={styles.field}>
                <span>Features (one per line)</span>
                <textarea name="features" rows={3} placeholder={"2 cameras\nEdited highlight reel\nSocial cut-downs"} />
              </label>
              {payoutsReady && (
                <label className={styles.checkItem}>
                  <input type="checkbox" name="bookable" /> Make this bookable online (accept secure payment through Plistic)
                </label>
              )}
              <button type="submit" className="p-btn p-btn--ghost">Add package</button>
            </form>
          </div>

          {/* Danger zone */}
          <div className={styles.danger}>
            <form action={deleteListing.bind(null, service.id)}>
              <button type="submit" className={styles.deleteBtn}>
                <Trash2 aria-hidden="true" size={15} /> Delete this listing
              </button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
