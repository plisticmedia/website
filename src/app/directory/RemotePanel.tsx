import Link from "next/link";
import type { UnlocatedService } from "@/lib/services";
import styles from "./Directory.module.css";

/** Lists published businesses that have no single map pin — Scotland-wide,
 *  remote, or online-only — so they're visible alongside the map. */
export function RemotePanel({ items }: { items: UnlocatedService[] }) {
  if (items.length === 0) return null;

  return (
    <aside className={styles.remotePanel} aria-label="Scotland-wide and remote businesses">
      <h2>Scotland-wide &amp; remote</h2>
      <p className={styles.remoteHint}>
        {items.length} {items.length === 1 ? "business works" : "businesses work"} across Scotland or remotely, so
        they aren&apos;t pinned to one place.
      </p>
      <ul className={styles.remoteList}>
        {items.map((s) => (
          <li key={s.slug} className={styles.remoteItem}>
            <Link href={`/directory/${s.slug}`}>
              <span className={styles.remoteName}>
                <span className={`${styles.remoteDot} ${s.is_featured ? styles.remoteDotFeatured : ""}`} aria-hidden="true" />
                {s.title}
              </span>
              {s.areas.length > 0 && <p className={styles.remoteAreas}>Covers {s.areas.slice(0, 4).join(", ")}</p>}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
