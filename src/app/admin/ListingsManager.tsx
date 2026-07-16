"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  clearRating,
  moderateService,
  recheckRating,
  releaseOwner,
  setFeatured,
  setFounding,
  setVerified,
} from "./actions";
import styles from "./Admin.module.css";

export type AdminListing = {
  id: string;
  title: string;
  slug: string;
  status: string;
  is_featured: boolean;
  verified: boolean;
  founding: boolean;
  created_at: string;
  seller_id: string | null;
  source: string | null;
  claim_token: string | null;
  google_place_id: string | null;
  google_rating: number | null;
  google_rating_count: number | null;
  profiles: { display_name: string | null } | null;
};

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function CopyClaimLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={styles.btnSmall}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          // Clipboard blocked (e.g. insecure context) — fall back to a prompt.
          window.prompt("Copy this claim link:", url);
        }
      }}
    >
      {copied ? "Copied ✓" : "Copy claim link"}
    </button>
  );
}

export function ListingsManager({ listings, siteUrl }: { listings: AdminListing[]; siteUrl: string }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unclaimed" | "claimed" | "published" | "pending">("all");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((s) => {
      if (q && !`${s.title} ${s.slug}`.toLowerCase().includes(q)) return false;
      if (filter === "unclaimed" && s.seller_id) return false;
      if (filter === "claimed" && !s.seller_id) return false;
      if (filter === "published" && s.status !== "published") return false;
      if (filter === "pending" && s.status !== "pending") return false;
      return true;
    });
  }, [listings, query, filter]);

  const filters: Array<{ id: typeof filter; label: string }> = [
    { id: "all", label: "All" },
    { id: "unclaimed", label: "Unclaimed" },
    { id: "claimed", label: "Claimed" },
    { id: "published", label: "Published" },
    { id: "pending", label: "Pending" },
  ];

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: "0.6rem",
          flexWrap: "wrap",
          alignItems: "center",
          margin: "0.6rem 0 0.9rem",
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search businesses by name…"
          aria-label="Search businesses by name"
          style={{
            flex: "1 1 260px",
            minWidth: 0,
            padding: "0.55rem 0.8rem",
            border: "1px solid var(--p-line)",
            borderRadius: 8,
            fontSize: "0.95rem",
          }}
        />
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={styles.btnSmall}
              aria-pressed={filter === f.id}
              style={
                filter === f.id
                  ? { background: "var(--p-azure-deep)", color: "#fff", borderColor: "var(--p-azure-deep)" }
                  : undefined
              }
            >
              {f.label}
            </button>
          ))}
        </div>
        <span style={{ fontSize: "0.85rem", color: "var(--p-muted)", marginLeft: "auto" }}>
          Showing {shown.length} of {listings.length}
        </span>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th><th>Seller</th><th>Status</th><th>Trusted</th><th>Google</th><th>Created</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr><td colSpan={7} className={styles.emptyCell}>No businesses match “{query}”.</td></tr>
            )}
            {shown.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link href={`/directory/${s.slug}`} target="_blank">{s.title}</Link>
                  {!s.seller_id && s.claim_token && (
                    <div style={{ marginTop: "0.3rem" }}>
                      <CopyClaimLink url={`${siteUrl}/claim/${s.claim_token}`} />
                    </div>
                  )}
                </td>
                <td>{s.profiles?.display_name ?? "—"}</td>
                <td><span className={styles.badge}>{s.status}</span></td>
                <td>{s.is_featured ? <span className={`${styles.badge} ${styles.badgeTrusted}`}>Trusted</span> : "—"}</td>
                <td>
                  {s.google_place_id === "SKIP"
                    ? "off"
                    : s.google_rating != null
                      ? `★ ${s.google_rating}${s.google_rating_count != null ? ` (${s.google_rating_count})` : ""}`
                      : "—"}
                </td>
                <td>{fmt(s.created_at)}</td>
                <td className={styles.actions}>
                  {s.status !== "published" && (
                    <form action={moderateService.bind(null, s.id, "published")}>
                      <button className={styles.btnSmall} type="submit">Publish</button>
                    </form>
                  )}
                  {s.status !== "removed" && (
                    <form action={moderateService.bind(null, s.id, "removed")}>
                      <button className={`${styles.btnSmall} ${styles.btnDanger}`} type="submit">Remove</button>
                    </form>
                  )}
                  {s.is_featured ? (
                    <form action={setFeatured.bind(null, s.id, false)}>
                      <button className={styles.btnSmall} type="submit">Un-trust</button>
                    </form>
                  ) : (
                    <form action={setFeatured.bind(null, s.id, true)}>
                      <button className={`${styles.btnSmall} ${styles.btnTrust}`} type="submit">Make trusted</button>
                    </form>
                  )}
                  <form action={setVerified.bind(null, s.id, !s.verified)}>
                    <button className={styles.btnSmall} type="submit">{s.verified ? "Unverify" : "Verify"}</button>
                  </form>
                  <form action={setFounding.bind(null, s.id, !s.founding)}>
                    <button className={styles.btnSmall} type="submit">{s.founding ? "Un-found" : "Founding"}</button>
                  </form>
                  {s.google_place_id === "SKIP" ? (
                    <form action={recheckRating.bind(null, s.id)}>
                      <button className={styles.btnSmall} type="submit">Re-check Google</button>
                    </form>
                  ) : (s.google_rating != null || s.google_place_id) ? (
                    <form action={clearRating.bind(null, s.id)}>
                      <button className={`${styles.btnSmall} ${styles.btnDanger}`} type="submit">Clear rating</button>
                    </form>
                  ) : null}
                  {s.seller_id && (
                    <form action={releaseOwner.bind(null, s.id)}>
                      <button className={`${styles.btnSmall} ${styles.btnDanger}`} type="submit">Release owner</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
