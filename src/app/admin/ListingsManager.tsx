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
import { ActionButton } from "@/components/ActionButton";
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

function CopyClaimLink({ token, siteUrl }: { token: string; siteUrl: string }) {
  const [copied, setCopied] = useState(false);
  // Always produce a full, sendable URL. Prefer the configured site URL, but
  // fall back to the browser's own origin so a missing NEXT_PUBLIC_SITE_URL
  // never yields a partial "/claim/..." link.
  const base = (siteUrl || (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/$/, "");
  const url = `${base}/claim/${token}`;
  return (
    <button
      type="button"
      className={styles.btnSmall}
      title={url}
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
                  <div style={{ marginTop: "0.3rem", display: "flex", flexDirection: "column", gap: "0.3rem", alignItems: "flex-start" }}>
                    {s.seller_id ? (
                      <>
                        <span style={{ fontSize: "0.75rem", color: "var(--p-muted)" }}>
                          Claimed{s.profiles?.display_name ? ` by ${s.profiles.display_name}` : ""}
                        </span>
                        <ActionButton
                          action={releaseOwner.bind(null, s.id)}
                          pendingText="Releasing…"
                          className={`${styles.btnSmall} ${styles.btnDanger}`}
                          confirm={`Release ${s.profiles?.display_name ?? "the current owner"} from this listing?\n\nThey'll lose access, but all the profile content stays. You can then copy the claim link and send it to whoever should own it next.`}
                        >
                          Release &amp; re-invite
                        </ActionButton>
                      </>
                    ) : s.claim_token ? (
                      <CopyClaimLink token={s.claim_token} siteUrl={siteUrl} />
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "#b4690e" }}>
                        No claim token yet — run the backfill SQL
                      </span>
                    )}
                  </div>
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
                    <ActionButton action={moderateService.bind(null, s.id, "published")} pendingText="…" className={styles.btnSmall}>
                      Publish
                    </ActionButton>
                  )}
                  {s.status !== "removed" && (
                    <ActionButton action={moderateService.bind(null, s.id, "removed")} pendingText="…" className={`${styles.btnSmall} ${styles.btnDanger}`}>
                      Remove
                    </ActionButton>
                  )}
                  {s.is_featured ? (
                    <ActionButton action={setFeatured.bind(null, s.id, false)} pendingText="…" className={styles.btnSmall}>
                      Un-trust
                    </ActionButton>
                  ) : (
                    <ActionButton action={setFeatured.bind(null, s.id, true)} pendingText="…" className={`${styles.btnSmall} ${styles.btnTrust}`}>
                      Make trusted
                    </ActionButton>
                  )}
                  <ActionButton action={setVerified.bind(null, s.id, !s.verified)} pendingText="…" className={styles.btnSmall}>
                    {s.verified ? "Unverify" : "Verify"}
                  </ActionButton>
                  <ActionButton action={setFounding.bind(null, s.id, !s.founding)} pendingText="…" className={styles.btnSmall}>
                    {s.founding ? "Un-found" : "Founding"}
                  </ActionButton>
                  {s.google_place_id === "SKIP" ? (
                    <ActionButton action={recheckRating.bind(null, s.id)} pendingText="…" className={styles.btnSmall}>
                      Re-check Google
                    </ActionButton>
                  ) : (s.google_rating != null || s.google_place_id) ? (
                    <ActionButton action={clearRating.bind(null, s.id)} pendingText="…" className={`${styles.btnSmall} ${styles.btnDanger}`}>
                      Clear rating
                    </ActionButton>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
