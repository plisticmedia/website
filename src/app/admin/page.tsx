import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { approveClaim, publishShowcaseItem, refundDispute, rejectClaim, releaseDispute, removeShowcaseItem, revokeAdmin, setPeerConfidenceHidden } from "./actions";
import { ListingsManager } from "./ListingsManager";
import { ActionButton } from "@/components/ActionButton";
import { GrantAdminForm } from "./GrantAdminForm";
import { getPendingShowcaseItems } from "@/lib/showcase";
import { getPeerFeedbackForAdmin, getDisputedPeerConfidence } from "@/lib/peers";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { GeocodeButton } from "./GeocodeButton";
import { RatingsButton } from "./RatingsButton";
import { ConsolidateButton } from "./ConsolidateButton";
import { RehostLogosButton } from "./RehostLogosButton";
import { WebsiteLogosButton } from "./WebsiteLogosButton";
import { PublishImportedButton } from "./PublishImportedButton";
import { ClaimInvitesPanel } from "./ClaimInvitesPanel";
import { BackupButton } from "./BackupButton";
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
  const peerFeedback = await getPeerFeedbackForAdmin();
  const peerDisputes = await getDisputedPeerConfidence();

  const svc = (services.data ?? []) as unknown as Array<{ id: string; title: string; slug: string; status: string; is_featured: boolean; verified: boolean; founding: boolean; created_at: string; seller_id: string | null; source: string | null; claim_token: string | null; google_place_id: string | null; google_rating: number | null; google_rating_count: number | null; profiles: { display_name: string | null } | null }>;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.plisticmedia.com").replace(/\/$/, "");
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

  // Mailing list (safe if the table/migration isn't in yet — falls back to empty).
  const { data: subRows } = await svcRole
    .from("subscribers")
    .select("email, notify_stories, marketing, source, created_at")
    .is("unsubscribed_at", null)
    .order("created_at", { ascending: false })
    .limit(50);
  const subscribers = (subRows ?? []) as Array<{ email: string; notify_stories: boolean; marketing: boolean; source: string | null; created_at: string }>;

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
            <Link href="/admin/showcase" style={{ color: "var(--p-azure-deep)", fontWeight: 600 }}>
              Write &amp; manage showcase stories →
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
                        <ActionButton
                          action={revokeAdmin.bind(null, a.id)}
                          pendingText="Removing…"
                          className={`${styles.btnSmall} ${styles.btnDanger}`}
                          confirm={`Remove admin access from ${a.name ?? a.email ?? "this person"}?`}
                        >
                          Remove admin
                        </ActionButton>
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

          {/* Data backup */}
          <div style={{ border: "1px solid var(--p-line)", borderRadius: 12, padding: "1rem 1.1rem", marginTop: "0.8rem" }}>
            <h3 style={{ margin: "0 0 0.3rem" }}>Data backup</h3>
            <p style={{ margin: "0 0 0.2rem", fontSize: "0.9rem", color: "var(--p-muted)" }}>
              A snapshot of all your data is saved automatically every Sunday to private storage, and a
              summary is emailed to you. Take one now before any big change — you can never have too many.
            </p>
            <BackupButton />
          </div>

          {/* Mailing list */}
          <div style={{ border: "1px solid var(--p-line)", borderRadius: 12, padding: "1rem 1.1rem", marginTop: "0.8rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <h3 style={{ margin: "0 0 0.3rem" }}>Mailing list ({subscribers.length}{subscribers.length === 50 ? "+" : ""})</h3>
              {subscribers.length > 0 && (
                <a className={styles.btnSmall} href="/api/admin/subscribers" download>
                  Download all as CSV
                </a>
              )}
            </div>
            <p style={{ margin: "0 0 0.6rem", fontSize: "0.9rem", color: "var(--p-muted)" }}>
              People who signed up for story alerts and/or the newsletter, with what each opted into. Export the CSV to
              send from an email tool.
            </p>
            {subscribers.length === 0 ? (
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--p-muted)" }}>No signups yet.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr><th>Email</th><th>Story alerts</th><th>Newsletter</th><th>Signed up</th></tr>
                  </thead>
                  <tbody>
                    {subscribers.map((s) => (
                      <tr key={s.email}>
                        <td>{s.email}</td>
                        <td>{s.notify_stories ? "Yes" : "—"}</td>
                        <td>{s.marketing ? "Yes" : "—"}</td>
                        <td>{new Date(s.created_at).toLocaleDateString("en-GB")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Peer-confidence disputes — hide a score while reviewing */}
          {peerDisputes.length > 0 && (
            <div style={{ border: "1px solid var(--p-line)", borderRadius: 12, padding: "1rem 1.1rem", marginTop: "0.8rem" }}>
              <h3 style={{ margin: "0 0 0.3rem" }}>Peer-confidence disputes ({peerDisputes.length})</h3>
              <p style={{ margin: "0 0 0.6rem", fontSize: "0.9rem", color: "var(--p-muted)" }}>
                Businesses that flagged their public peer score. Hide it while you look into it.
              </p>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Business</th><th>Flagged</th><th>Public score</th><th>Action</th></tr></thead>
                  <tbody>
                    {peerDisputes.map((d) => (
                      <tr key={d.id}>
                        <td><Link href={`/directory/${d.slug}`} target="_blank">{d.title}</Link></td>
                        <td>{fmt(d.peer_confidence_disputed_at)}</td>
                        <td>{d.peer_confidence_hidden ? "Hidden" : "Visible"}</td>
                        <td className={styles.actions}>
                          <ActionButton
                            action={setPeerConfidenceHidden.bind(null, d.id, !d.peer_confidence_hidden)}
                            pendingText="…"
                            className={styles.btnSmall}
                          >
                            {d.peer_confidence_hidden ? "Show score" : "Hide score"}
                          </ActionButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Peer feedback — private B2B signal, never shown publicly */}
          <div style={{ border: "1px solid var(--p-line)", borderRadius: 12, padding: "1rem 1.1rem", marginTop: "0.8rem" }}>
            <h3 style={{ margin: "0 0 0.3rem" }}>Peer feedback ({peerFeedback.length}) <span style={{ fontWeight: 400, fontSize: "0.85rem", color: "var(--p-muted)" }}>· private</span></h3>
            <p style={{ margin: "0 0 0.6rem", fontSize: "0.9rem", color: "var(--p-muted)" }}>
              Businesses&apos; private feedback on confirmed collaborators. Never shown publicly or to the rated business —
              use it to steer who you feature and recommend.
            </p>
            {peerFeedback.length === 0 ? (
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--p-muted)" }}>No peer feedback yet.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr><th>About</th><th>From</th><th>Again?</th><th>Rel/Com/Qual</th><th>Note</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {peerFeedback.map((f) => (
                      <tr key={f.id}>
                        <td>{f.subject}</td>
                        <td>{f.rater}</td>
                        <td>
                          <span className={styles.badge} style={f.wouldWorkAgain === "no" ? { background: "rgba(200,40,40,0.12)", color: "#b42318" } : f.wouldWorkAgain === "mixed" ? { background: "rgba(180,105,14,0.12)", color: "#b4690e" } : undefined}>
                            {f.wouldWorkAgain}
                          </span>
                        </td>
                        <td>{[f.reliability, f.communication, f.quality].map((n) => n ?? "–").join(" / ")}</td>
                        <td>{f.privateNote ?? "—"}</td>
                        <td>{fmt(f.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
                              <ActionButton action={refundDispute.bind(null, d.orders.id)} pendingText="Refunding…" className={`${styles.btnSmall} ${styles.btnDanger}`}>
                                Refund buyer
                              </ActionButton>
                              <ActionButton action={releaseDispute.bind(null, d.orders.id)} pendingText="Releasing…" className={styles.btnSmall}>
                                Release to seller
                              </ActionButton>
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
                          <ActionButton action={approveClaim.bind(null, c.id)} pendingText="Approving…" className={styles.btnSmall}>
                            Approve
                          </ActionButton>
                          <ActionButton action={rejectClaim.bind(null, c.id)} pendingText="Rejecting…" className={`${styles.btnSmall} ${styles.btnDanger}`}>
                            Reject
                          </ActionButton>
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
                          <ActionButton action={publishShowcaseItem.bind(null, s.id)} pendingText="Publishing…" className={styles.btnSmall}>
                            Publish
                          </ActionButton>
                          <ActionButton action={removeShowcaseItem.bind(null, s.id)} pendingText="Rejecting…" className={`${styles.btnSmall} ${styles.btnDanger}`}>
                            Reject
                          </ActionButton>
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
          <ListingsManager listings={svc} siteUrl={siteUrl} />

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
