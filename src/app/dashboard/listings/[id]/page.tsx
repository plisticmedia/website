import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Trash2, Upload } from "lucide-react";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { requireUser } from "@/lib/auth";
import { getCategories, getSellerServiceById } from "@/lib/services";
import {
  addPackage,
  deleteListing,
  deleteMedia,
  deletePackage,
  setListingStatus,
  updateListing,
  uploadMedia,
} from "../actions";
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
  const [service, categories] = await Promise.all([
    getSellerServiceById(profile.id, id),
    getCategories(),
  ]);
  if (!service) notFound();

  const isPublished = service.status === "published";
  const packages = [...service.service_packages].sort((a, b) => a.sort_order - b.sort_order);
  const media = [...service.service_media].sort((a, b) => a.sort_order - b.sort_order);

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
              ) : (
                <form action={setListingStatus.bind(null, service.id, "published")}>
                  <button type="submit" className="p-btn">Publish</button>
                </form>
              )}
              {isPublished && (
                <Link href={`/directory/${service.slug}`} className={styles.viewLink} target="_blank">
                  View <ExternalLink aria-hidden="true" size={14} />
                </Link>
              )}
            </div>
          </div>

          {/* Details */}
          <form action={updateListing.bind(null, service.id)} className={styles.form}>
            <h2 className={styles.sectionTitle}>Details</h2>
            <label className={styles.field}>
              <span>Title *</span>
              <input name="title" type="text" required maxLength={140} defaultValue={service.title} />
            </label>
            <label className={styles.field}>
              <span>Category</span>
              <select name="category_id" defaultValue={service.category_id ?? ""}>
                <option value="">Choose a category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Short summary</span>
              <input name="summary" type="text" maxLength={280} defaultValue={service.summary ?? ""} />
            </label>
            <label className={styles.field}>
              <span>Description</span>
              <textarea name="description" rows={6} maxLength={6000} defaultValue={service.description ?? ""} />
            </label>
            <button type="submit" className="p-btn">Save details</button>
          </form>

          {/* Media */}
          <div className={styles.block}>
            <h2 className={styles.sectionTitle}>Photos</h2>
            <p className={styles.sub}>The first image becomes your cover. JPG/PNG/WebP, up to 5 MB.</p>
            {media.length > 0 && (
              <div className={styles.mediaGrid}>
                {media.map((m) => (
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
            <form action={uploadMedia.bind(null, service.id)} className={styles.uploadForm}>
              <input type="file" name="file" accept="image/*" required />
              <button type="submit" className="p-btn p-btn--ghost">
                <Upload aria-hidden="true" size={16} /> Upload
              </button>
            </form>
          </div>

          {/* Packages */}
          <div className={styles.block}>
            <h2 className={styles.sectionTitle}>Packages</h2>
            <p className={styles.sub}>Display pricing only — buyers enquire and arrange directly with you.</p>
            {packages.length > 0 && (
              <ul className={styles.packageList}>
                {packages.map((p) => (
                  <li key={p.id}>
                    <div>
                      <strong>{p.name}</strong> — {gbp(p.price_gbp)}
                      {p.delivery_days != null && <span className={styles.rowMeta}> · {p.delivery_days} days</span>}
                      {p.features.length > 0 && <div className={styles.rowMeta}>{p.features.join(", ")}</div>}
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
