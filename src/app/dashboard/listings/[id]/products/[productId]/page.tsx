import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateProduct, deleteProduct, deleteProductPhoto } from "../../../products-actions";
import { ProductPhotoUploader } from "./ProductPhotoUploader";
import styles from "../../../Listings.module.css";

export const metadata: Metadata = { title: "Edit item | Plistic" };
export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string; productId: string }> }) {
  const { id: serviceId, productId } = await params;
  const profile = await requireUser(`/dashboard/listings/${serviceId}/products/${productId}`);
  const supabase = await createSupabaseServerClient();

  const { data: service } = await supabase
    .from("services")
    .select("id, title")
    .eq("id", serviceId)
    .eq("seller_id", profile.id)
    .maybeSingle();
  if (!service) notFound();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("service_id", serviceId)
    .maybeSingle();
  if (!product) notFound();

  const { data: media } = await supabase
    .from("product_media")
    .select("id, url, sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });
  const photos = (media ?? []) as Array<{ id: string; url: string }>;

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.innerNarrow}`}>
          <p className={styles.kicker}>
            <Link href="/dashboard/listings">My listings</Link> /{" "}
            <Link href={`/dashboard/listings/${serviceId}`}>{service.title}</Link> / Item
          </p>
          <h1>Edit item</h1>

          <form action={updateProduct.bind(null, serviceId, productId)} className={styles.form}>
            <label className={styles.field}>
              <span>Name *</span>
              <input name="title" type="text" required maxLength={160} defaultValue={product.title} />
            </label>
            <label className={styles.field}>
              <span>Description</span>
              <textarea
                name="description"
                rows={5}
                maxLength={6000}
                defaultValue={product.description ?? ""}
                placeholder="What is it — materials, size, what's included…"
              />
            </label>
            <div className={styles.packageFields}>
              <label className={styles.field}>
                <span>Price (GBP)</span>
                <input
                  name="price_gbp"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={product.price_gbp ?? ""}
                  placeholder="Blank = price on enquiry"
                />
              </label>
              <label className={styles.field}>
                <span>Type</span>
                <select name="product_type" defaultValue={product.product_type}>
                  <option value="physical">Physical item (crafts, prints, goods…)</option>
                  <option value="service">Service</option>
                </select>
              </label>
            </div>
            <div className={styles.packageFields}>
              <label className={styles.field}>
                <span>Stock (optional)</span>
                <input
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={product.stock ?? ""}
                  placeholder="Blank = made to order"
                />
              </label>
              <label className={styles.field}>
                <span>Delivery</span>
                <select name="fulfilment" defaultValue={product.fulfilment ?? ""}>
                  <option value="">Not specified</option>
                  <option value="shipping">Shipping</option>
                  <option value="collection">Collection</option>
                  <option value="both">Shipping or collection</option>
                </select>
              </label>
            </div>
            <label className={styles.field}>
              <span>Delivery / collection details</span>
              <input
                name="delivery_info"
                type="text"
                maxLength={600}
                defaultValue={product.delivery_info ?? ""}
                placeholder="e.g. UK shipping £4.50, or collect from Glasgow"
              />
            </label>
            <label className={styles.field}>
              <span>Revisions included (optional)</span>
              <input
                name="revision_limit"
                type="number"
                min="0"
                step="1"
                defaultValue={product.revision_limit ?? ""}
                placeholder="Blank = unlimited"
              />
              <small style={{ color: "var(--p-muted)", fontWeight: 400 }}>
                How many rounds of changes a buyer can request for free. After that, further changes are arranged
                and paid for with you directly. Mostly useful for services.
              </small>
            </label>
            <label className={styles.field}>
              <span>Status</span>
              <select name="status" defaultValue={product.status === "active" ? "active" : "draft"}>
                <option value="draft">Draft (hidden)</option>
                <option value="active">Active (live once the marketplace opens)</option>
              </select>
              <small style={{ color: "var(--p-muted)", fontWeight: 400 }}>
                Add at least one photo and a price before setting it live.
              </small>
            </label>
            <button type="submit" className="p-btn">Save item</button>
          </form>

          <div className={styles.block}>
            <h2 className={styles.sectionTitle}>Photos</h2>
            <p className={styles.sub}>
              Show what you&apos;re selling — the first photo is the main image. Big phone photos are fine; we resize
              them for you.
            </p>
            {photos.length > 0 && (
              <div className={styles.mediaGrid}>
                {photos.map((m) => (
                  <div key={m.id} className={styles.mediaItem}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt="" />
                    <form action={deleteProductPhoto.bind(null, serviceId, productId, m.id)}>
                      <button type="submit" aria-label="Remove photo" className={styles.mediaDelete}>
                        <Trash2 aria-hidden="true" size={15} />
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
            <ProductPhotoUploader serviceId={serviceId} productId={productId} />
          </div>

          <div className={styles.danger}>
            <form action={deleteProduct.bind(null, serviceId, productId)}>
              <button type="submit" className={styles.deleteBtn}>
                <Trash2 aria-hidden="true" size={15} /> Delete this item
              </button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
