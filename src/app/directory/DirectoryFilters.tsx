"use client";

import { useRouter } from "next/navigation";
import type { Category, Location } from "@/lib/types";
import styles from "./Directory.module.css";

type Current = { q?: string; category?: string; location?: string; rating?: string };

export function DirectoryFilters({
  categories,
  locations,
  current,
}: {
  categories: Category[];
  locations: Location[];
  current: Current;
}) {
  const router = useRouter();

  function go(next: Partial<Current>) {
    const merged = { ...current, ...next };
    const sp = new URLSearchParams();
    if (merged.q) sp.set("q", merged.q);
    if (merged.category) sp.set("category", merged.category);
    if (merged.location) sp.set("location", merged.location);
    if (merged.rating) sp.set("rating", merged.rating);
    const qs = sp.toString();
    router.push(qs ? `/directory?${qs}` : "/directory");
  }

  const hasFilters = Boolean(current.category || current.location || current.rating);

  return (
    <div className={styles.filterBar}>
      <label className={styles.filterField}>
        <span>Service</span>
        <select value={current.category ?? ""} onChange={(e) => go({ category: e.target.value || undefined })}>
          <option value="">All services</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.filterField}>
        <span>Location</span>
        <select value={current.location ?? ""} onChange={(e) => go({ location: e.target.value || undefined })}>
          <option value="">All of Scotland</option>
          {locations.map((l) => (
            <option key={l.id} value={l.slug}>
              {l.name}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.filterField}>
        <span>Rating</span>
        <select value={current.rating ?? ""} onChange={(e) => go({ rating: e.target.value || undefined })}>
          <option value="">Any rating</option>
          <option value="4.5">4.5★ and up</option>
          <option value="4">4★ and up</option>
          <option value="3">3★ and up</option>
        </select>
      </label>

      {hasFilters && (
        <button type="button" className={styles.filterClear} onClick={() => go({ category: undefined, location: undefined, rating: undefined })}>
          Clear filters
        </button>
      )}
    </div>
  );
}
