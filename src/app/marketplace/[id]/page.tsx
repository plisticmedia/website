import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Package, Truck, Store } from "lucide-react";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { getMarketplaceItem } from "@/lib/marketplace";
import { gbp } from "../ItemCard";
import { BuyItemButton } from "./BuyItemButton";
import styles from "../Marketplace.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = await getMarketplaceItem(id);
  if (!item) return { title: "Item not found | Plistic" };
  const title = `${item.title} | Plistic Marketplace`;
  const description = item.description?.slice(0, 200) ?? `${item.title} from ${item.seller.business}.`;
  const image = item.images[0];
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
  };
}

const FULFILMENT_LABEL: Record<string, { icon: typeof Truck; text: string }> = {
  shipping: { icon: Truck, text: "Shipping available" },
  collection: { icon: Store, text: "Collection only" },
  both: { icon: Truck, text: "Shipping or collection" },
};

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getMarketplaceItem(id);
  if (!item) notFound();

  const price = gbp(item.price_gbp);
  const cover = item.images[0];
  const rest = item.images.slice(1);
  const ful = item.fulfilment ? FULFILMENT_LABEL[item.fulfilment] : null;
  const FulIcon = ful?.icon;
  // Buyable when the item has a real price, isn't sold out, and the seller can
  // actually receive payouts. Otherwise buyers enquire directly.
  const outOfStock = typeof item.stock === "number" && item.stock <= 0;
  const buyable = item.price_gbp != null && item.price_gbp > 0 && item.seller.payouts_enabled && !outOfStock;

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`${styles.itemWrap} p-container`}>
          <p className={styles.crumb}>
            <Link href="/marketplace">Marketplace</Link> /{" "}
            <Link href={`/directory/${item.seller.slug}`}>{item.seller.business}</Link>
          </p>

          <div className={styles.itemGrid}>
            <div className={styles.gallery}>
              <div className={styles.mainImage}>
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt={item.title} />
                ) : (
                  <div className={styles.thumbEmpty}>
                    <Package aria-hidden="true" size={44} />
                  </div>
                )}
              </div>
              {rest.length > 0 && (
                <div className={styles.thumbs}>
                  {rest.map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={src} src={src} alt="" />
                  ))}
                </div>
              )}
            </div>

            <div className={styles.itemInfo}>
              <span className={styles.kicker} style={{ color: "var(--p-azure-deep, #0c6f9e)" }}>
                {item.product_type === "service" ? "Service" : "For sale"}
              </span>
              <h1>{item.title}</h1>
              {price ? <p className={styles.itemPrice}>{price}</p> : <p className={styles.itemPrice}>Price on enquiry</p>}

              <div className={styles.itemMeta}>
                <span>
                  Sold by{" "}
                  <Link href={`/directory/${item.seller.slug}`} className={styles.sellerLink}>
                    {item.seller.business}
                  </Link>
                </span>
                {item.seller.location && (
                  <span>
                    <MapPin aria-hidden="true" size={15} style={{ verticalAlign: "-2px" }} /> {item.seller.location}
                  </span>
                )}
                {ful && FulIcon && (
                  <span>
                    <FulIcon aria-hidden="true" size={15} style={{ verticalAlign: "-2px" }} /> {ful.text}
                  </span>
                )}
                {item.delivery_info && <span>{item.delivery_info}</span>}
                {typeof item.revision_limit === "number" && (
                  <span>
                    {item.revision_limit === 0
                      ? "No revisions included"
                      : `Includes ${item.revision_limit} revision${item.revision_limit === 1 ? "" : "s"}`}
                  </span>
                )}
                {typeof item.stock === "number" && item.stock > 0 && <span>{item.stock} available</span>}
              </div>

              {item.description && <div className={styles.desc}>{item.description}</div>}

              <div className={styles.buyBox}>
                {buyable ? (
                  <>
                    <BuyItemButton
                      productId={item.id}
                      priceLabel={price ?? ""}
                      maxQty={typeof item.stock === "number" ? item.stock : null}
                    />
                    <p className={styles.buyNote}>
                      Your payment is held securely by Plistic and only released to {item.seller.business} once your
                      order is confirmed delivered.
                    </p>
                    <p className={styles.buyOr}>
                      or <Link href={`/directory/${item.seller.slug}#enquire`}>message the seller</Link> with a question
                    </p>
                  </>
                ) : (
                  <>
                    <Link
                      href={`/directory/${item.seller.slug}#enquire`}
                      className="p-btn"
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      Enquire about this item
                    </Link>
                    <p className={styles.buyNote}>
                      {outOfStock
                        ? `This item is currently sold out — message ${item.seller.business} to ask about more.`
                        : `Message ${item.seller.business} directly to arrange this.`}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
