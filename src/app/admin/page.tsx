import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { approveClaim, clearRating, moderateService, publishShowcaseItem, recheckRating, refundDispute, rejectClaim, releaseDispute, releaseOwner, removeShowcaseItem, revokeAdmin, setFeatured, setFounding, setVerified } from "./actions";
import { GrantAdminForm } from "./GrantAdminForm";
import { getPendingShowcaseItems } from "@/lib/showcase";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { GeocodeButton } from "./GeocodeButton";
import { RatingsButton } from "./RatingsButton";
import { ConsolidateButton } from "./ConsolidateButton";
import { RehostLogosButton } from "./RehostLogosButton";
import { WebsiteLogosButton } from "./WebsiteLogosButton";
import { PublishImportedButton } from "./PublishImportedButton";
import { ClaimInvitesPanel } from "./ClaimInvitesPanel";
import styles from "./Admin.module.css";

export const metadata: Metadata = { title: "Admin | Plistic", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  // Admin RLS policies grant full read access across these tables.
  const [services, enquiries, referrals, partnerships, leads, quotes, bookings, sponsorships, claims, disputes, missingGeo] =
    await Promise.all([
      supabase.from("services").select("id, title, slug, status, is_featured, verified, founding, created_at, seller_id, source, claim_token, google_place_id, google_rating, google_rating_count, profiles(display_name)").order("created_at", { ascending: false }),
      supabase.from("enquiries").select("id, buyer_name, buyer_email, status, created_at, services(title)").order("created_at", { ascending: false }),
      supabase.from("referrals").select("id, referrer_name, referrer_email, referred_name, status, created_at").order("created_at", { ascending: false }),
      supabase.from("partnerships").select("id, partner_name, partner_email, partner_discipline, status, created_at").order("created_at", { ascending: false }),
      supabase.from("leads").select("id, name, email, source, status, created_at").order("created_at", { ascending: false }),
      supabase.from("quotes").select("id, name, email, estimate_gbp, status, created_at").order("created_at", { ascending: false }),
      supabase.from("bookings").select("id, name, email, scheduled_at, status, created_at").order("created_at", { ascending: false }),
      supabase.from("sponsorships").select("id, seller_id, status, current_period_end").order("created_at", { ascending: false }),
      supabase.from("claims").select("id, evidence, created_at, services(title, slug), profiles(display_name)").eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("disputes").select("id, reason, status, created_at, orders(id, amount_gbp, commission_gbp, services(title, slug))").eq("status", "open").order("created_at", { ascending: false }),
      supabase.from("services").select("id", { count: "exact", head: true }).is("latitude", null).not("location_id", "is", null),
    ]);

  const showcasePending = await getPendingShowcaseItems();

  const svc = (services.data ?? []) as unknown as Array<{ id: string; title: string; slug: string; status: string; is_featured: boolean; verified: boolean; founding: boolean; created_at: string; seller_id: string | null; source: string | null; claim_token: string | null; google_place_id: string | null; google_rating: number | null; google_rating_count: number | null; profiles: { display_name: string | null } | null }>;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const enq = (enquiries.data ?? []) as unknown as Array<{ id: string; buyer_name: string; buyer_email: string; status: string; created_at: string; services: { title: string } | null }>;
  const refs = (referrals.data ?? []) as Array<Record<string, string>>;
  const parts = (partnerships.data ?? []) as Array<Record<string, string>>;
  const leadRows = (leads.data ?? []) as Array<Record<string, string>>;
  const quoteRows = (quotes.data ?? []) as Array<Record<string, string | number>>;
  const bookingRows = (bookings.data ?? []) as Array<Record<string, string>>;
  const sponsorRows = (sponsorships.data ?? []) as Array<Record<string, string>>;
  const claimRows = (claims.data ?? []) as unknown as Array<{
    id: string;
    evidence: string | null;
    created_at: string;
    services: { title: string; slug: string } | null;
    profiles: { display_name: string | null } | null;
  }>;
  const disputeRows = (disputes.data ?? []) as unknown as Array<{
    id: string;
    reason: string | null;
    status: string;
    created_at: string;
    orders: { id: string; amount_gbp: number; commission_gbp: number; services: { title: string; slug: string } | null } | null;
  }>;

  // Who has admin access (with emails from the auth user).
  const svcRole = createSupabaseServiceRoleClient();
  const { data: adminRows } = await svcRole.from("profiles").select("id, display_name").eq("role", "admin");
  const admins = await Promise.all(
    ((adminRows ?? []) as Array<{ id: string; display_name: string | null }>).map(async (p) => {
      const { data } = await svcRole.auth.admin.getUserById(p.id);
      return { id: p.id, name: p.display_name, email: data?.user?.email ?? null };
    }),
  );

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.inner}`}>
          <p className={styles.kicker}>Admin</p>
          <h1>Admin dashboard</h1>
          <p style={{ marginTop: "0.5rem", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <Link href="/admin/taxonomy" style={{ color: "var(--p-azure-deep)", fontWeight: 600 }}>
              Manage services &amp; locations →
            </Link>
            <Link href="/admin/import" style={{ color: "var(--p-azure-deep)", fontWeight: 600 }}>
              Import listings from CSV →
            </Link>
          </p>
          {(missingGeo.count ?? 0) > 0 && <GeocodeButton remaining={missingGeo.count ?? 0} />}
          <RatingsButton />
          <ConsolidateButton />
          <RehostLogosButton />
          <WebsiteLogosButton />
          <PublishImportedButton count={svc.filter((s) => s.status === "pending" && !s.seller_id && !!s.source).length} />
          <ClaimInvitesPanel />

          {/* Team & admin access */}
          <div style={{ border: "1px solid var(--p-line)", borderRadius: 12, padding: "1rem 1.1rem", marginTop: "0.8rem" }}>
            <h3 style={{ margin: "0 0 0.3rem" }}>Team &amp; admin access</h3>
            <p style={{ margin: "0 0 0.6rem", fontSize: "0.9rem", color: "var(--p-muted)" }}>
              Everyone here can open this admin area. Remove anyone who shouldn&apos;t have it.
            </p>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>Name</th><th>Email</th><th>Action</th></tr></thead>
                <tbody>
                  {admins.map((a) => (
                    <tr key={a.id}>
                      <td>{a.name ?? "—"}</td>
                      <td>{a.email ?? "—"}</td>
                      <td>
                        <form action={revokeAdmin.bind(null, a.id)}>
                          <button className={`${styles.btnSmall} ${styles.btnDanger}`} type="submit">Remove admin</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <GrantAdminForm buttonClassName={styles.btnSmall} />
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", color: "var(--p-muted)" }}>
              The person must have created an account first (at /login). Then enter their email here.
            </p>
          </div>

          <div className={styles.stats}>
            <Stat label="Listings" value={svc.length} />
            <Stat label="Published" value={svc.filter((s) => s.status === "published").length} />
            <Stat label="Enquiries" value={enq.length} />
            <Stat label="Referrals" value={refs.length} />
            <Stat label="Partnerships" value={parts.length} />
            <Stat label="Active sponsors" value={sponsorRows.filter((s) => s.status === "active").length} />
          </div>

          {/* Order disputes — money is held until resolved */}
          {disputeRows.length > 0 && (
            <>
              <h2 className={styles.sectionTitle}>Order disputes ({disputeRows.length})</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr><th>Order</th><th>Amount</th><th>Reason</th><th>Date</th><th>Resolve</th></tr>
                  </thead>
                  <tbody>
                    {disputeRows.map((d) => (
                      <tr key={d.id}>
                        <td>
                          {d.orders?.services?.slug ? (
                            <Link href={`/directory/${d.orders.services.slug}`} target="_blank">
                              {d.orders.services.title}
                            </Link>
                          ) : "—"}
                        </td>
                        <td>£{Number(d.orders?.amount_gbp ?? 0).toFixed(2)}</td>
                        <td>{d.reason ?? "—"}</td>
                        <td>{fmt(d.created_at)}</td>
                        <td className={styles.actions}>
                          {d.orders?.id && (
                            <>
                              <form action={refundDispute.bind(null, d.orders.id)}>
                                <button className={`${styles.btnSmall} ${styles.btnDanger}`} type="submit">Refund buyer</button>
                              </form>
                              <form action={releaseDispute.bind(null, d.orders.id)}>
                                <button className={styles.btnSmall} type="submit">Release to seller</button>
                              </form>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Claim requests */}
          {claimRows.length > 0 && (
            <>
              <h2 className={styles.sectionTitle}>Claim requests ({claimRows.length})</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr><th>Listing</th><th>Claimant</th><th>Proof</th><th>Date</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {claimRows.map((c) => (
                      <tr key={c.id}>
                        <td>
                          {c.services?.slug ? (
                            <Link href={`/directory/${c.services.slug}`} target="_blank">{c.services.title}</Link>
                          ) : "—"}
                        </td>
                        <td>{c.profiles?.display_name ?? "—"}</td>
                        <td>{c.evidence ?? "—"}</td>
                        <td>{fmt(c.created_at)}</td>
                        <td className={styles.actions}>
                          <form action={approveClaim.bind(null, c.id)}>
                            <button className={styles.btnSmall} type="submit">Approve</button>
                          </form>
                          <form action={rejectClaim.bind(null, c.id)}>
                            <button className={`${styles.btnSmall} ${styles.btnDanger}`} type="submit">Reject</button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Showcase submissions */}
          {showcasePending.length > 0 && (
            <>
              <h2 className={styles.sectionTitle}>Showcase submissions ({showcasePending.length})</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr><th>Title</th><th>Kind</th><th>Source</th><th>Link</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {showcasePending.map((s) => (
                      <tr key={s.id}>
                        <td>{s.title}{s.summary ? <div className={styles.note}>{s.summary}</div> : null}</td>
                        <td>{s.kind}</td>
                        <td>{s.source ?? "—"}</td>
                        <td>
                          {s.link_url ? <a href={s.link_url} target="_blank" rel="noreferrer">link</a> : null}
                          {s.embed_url ? <> <a href={s.embed_url} target="_blank" rel="noreferrer">video</a></> : null}
                          {!s.link_url && !s.embed_url ? "—" : null}
                        </td>
                        <td className={styles.actions}>
                          <form action={publishShowcaseItem.bind(null, s.id)}>
                            <button className={styles.btnSmall} type="submit">Publish</button>
                          </form>
                          <form action={removeShowcaseItem.bind(null, s.id)}>
                            <button className={`${styles.btnSmall} ${styles.btnDanger}`} type="submit">Reject</button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Listings moderation */}
          <h2 className={styles.sectionTitle}>Listings</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Title</th><th>Seller</th><th>Status</th><th>Trusted</th><th>Google</th><th>Created</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {svc.length === 0 && <tr><td colSpan={7} className={styles.emptyCell}>No listings yet.</td></tr>}
                {svc.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Link href={`/directory/${s.slug}`} target="_blank">{s.title}</Link>
                      {!s.seller_id && s.claim_token && (
                        <>
                          <br />
                          <a
                            href={`${siteUrl}/claim/${s.claim_token}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: "0.75rem", color: "var(--p-azure-deep)" }}
                          >
                            claim link ↗
                          </a>
                        </>
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

          {/* Enquiries */}
          <h2 className={styles.sectionTitle}>Enquiries</h2>
          <SimpleTable
            head={["Buyer", "Email", "Listing", "Status", "Date"]}
            rows={enq.map((e) => [e.buyer_name, e.buyer_email, e.services?.title ?? "—", e.status, fmt(e.created_at)])}
          />

          {/* Referrals */}
          <h2 className={styles.sectionTitle}>Referrals <span className={styles.note}>(10% of confirmed project value)</span></h2>
          <SimpleTable
            head={["Referrer", "Email", "Referred", "Status", "Date"]}
            rows={refs.map((r) => [r.referrer_name, r.referrer_email, r.referred_name, r.status, fmt(r.created_at)])}
          />

          {/* Partnerships */}
          <h2 className={styles.sectionTitle}>Partnership enquiries</h2>
          <SimpleTable
            head={["Name", "Email", "Discipline", "Status", "Date"]}
            rows={parts.map((p) => [p.partner_name, p.partner_email, p.partner_discipline, p.status, fmt(p.created_at)])}
          />

          {/* Quotes */}
          <h2 className={styles.sectionTitle}>Quotes</h2>
          <SimpleTable
            head={["Name", "Email", "Estimate", "Status", "Date"]}
            rows={quoteRows.map((q) => [String(q.name ?? "—"), String(q.email ?? "—"), q.estimate_gbp != null ? `£${q.estimate_gbp}` : "—", String(q.status), fmt(String(q.created_at))])}
          />

          {/* Bookings */}
          <h2 className={styles.sectionTitle}>Bookings</h2>
          <SimpleTable
            head={["Name", "Email", "Scheduled", "Status", "Date"]}
            rows={bookingRows.map((b) => [b.name ?? "—", b.email ?? "—", fmt(b.scheduled_at ?? null), b.status, fmt(b.created_at)])}
          />

          {/* Generic leads */}
          <h2 className={styles.sectionTitle}>Other leads</h2>
          <SimpleTable
            head={["Name", "Email", "Source", "Status", "Date"]}
            rows={leadRows.map((l) => [l.name ?? "—", l.email ?? "—", l.source ?? "—", l.status, fmt(l.created_at)])}
          />
        </section>
      </main>
      <Footer />
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

function SimpleTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>{head.map((h) => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={head.length} className={styles.emptyCell}>Nothing yet.</td></tr>
          )}
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
