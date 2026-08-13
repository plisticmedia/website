import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import type { MarketplaceItem } from "@/lib/marketplace";
import styles from "./Marketplace.module.css";

export function gbp(value: number | null): string | null {
  if (value == null) return null;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function ItemCard({ item }: { item: MarketplaceItem }) {
  const price = gbp(item.price_gbp);
  const cover = item.images[0];
  return (
    <Link href={`/marketplace/${item.id}`} className={styles.card}>
      <div className={styles.thumb}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={item.title} loading="lazy" />
        ) : (
          <div className={styles.thumbEmpty}>
            <ShoppingBag aria-hidden="true" size={30} />
          </div>
        )}
        <span className={styles.typeTag}>{item.product_type === "service" ? "Service" : "Item"}</span>
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{item.title}</h3>
        {price ? <p className={styles.price}>{price}</p> : <p className={styles.enquiry}>Price on enquiry</p>}
        <p className={styles.seller}>{item.seller.business}{item.seller.location ? ` · ${item.seller.location}` : ""}</p>
      </div>
    </Link>
  );
}
