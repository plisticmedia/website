"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import styles from "./Marketplace.module.css";

const TYPES = [
  { key: "", label: "All" },
  { key: "physical", label: "Items" },
  { key: "service", label: "Services" },
] as const;

export function MarketplaceFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const activeType = params.get("type") ?? "";

  function apply(next: { q?: string; type?: string }) {
    const sp = new URLSearchParams(params.toString());
    if (next.q !== undefined) {
      if (next.q.trim()) sp.set("q", next.q.trim());
      else sp.delete("q");
    }
    if (next.type !== undefined) {
      if (next.type) sp.set("type", next.type);
      else sp.delete("type");
    }
    sp.delete("page");
    router.push(`/marketplace?${sp.toString()}`);
  }

  return (
    <div className={styles.filters}>
      <form
        className={styles.search}
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q });
        }}
      >
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search items and services…"
          aria-label="Search the marketplace"
        />
        <button type="submit" className="p-btn">
          <Search aria-hidden="true" size={16} /> Search
        </button>
      </form>
      <div className={styles.chips}>
        {TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`${styles.chip} ${activeType === t.key ? styles.chipActive : ""}`}
            onClick={() => apply({ type: t.key })}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
