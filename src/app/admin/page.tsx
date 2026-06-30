import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { moderateService, setFeatured } from "./actions";
import styles from "./Admin.module.css";

export const metadata: Metadata = { title: "Admin | Plistic" };
export const dynamic = "force-dynamic";

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  // Admin RLS policies grant full read access across these tables.
  const [services, enquiries, referrals, partnerships, leads, quotes, bookings, sponsorships] =
    await Promise.all([
      supabase.from("services").select("id, title, slug, status, is_featured, created_at, profiles(display_name)").order("created_at", { ascending: false }),
      supabase.from("enquiries").select("id, buyer_name, buyer_email, status, created_at, services(title)").order("created_at", { ascending: false }),
      supabase.from("referrals").select("id, referrer_name, referrer_email, referred_name, status, created_at").order("created_at", { ascending: false }),
      supabase.from("partnerships").select("id, partner_name, partner_email, partner_discipline, status, created_at").order("created_at", { ascending: false }),
      supabase.from("leads").select("id, name, email, source, status, created_at").order("created_at", { ascending: false }),
      supabase.from("quotes").select("id, name, email, estimate_gbp, status, created_at").order("created_at", { ascending: false }),
      supabase.from("bookings").select("id, name, email, scheduled_at, status, created_at").order("created_at", { ascending: false }),
      supabase.from("sponsorships").select("id, seller_id, status, current_period_end").order("created_at", { ascending: false }),
    ]);

  const svc = (services.data ?? []) as unknown as Array<{ id: string; title: string; slug: string; status: string; is_featured: boolean; created_at: string; profiles: { display_name: string | null } | null }>;
  const enq = (enquiries.data ?? []) as unknown as Array<{ id: string; buyer_name: string; buyer_email: string; status: string; created_at: string; services: { title: string } | null }>;
  const refs = (referrals.data ?? []) as Array<Record<string, string>>;
  const parts = (partnerships.data ?? []) as Array<Record<string, string>>;
  const leadRows = (leads.data ?? []) as Array<Record<string, string>>;
  const quoteRows = (quotes.data ?? []) as Array<Record<string, string | number>>;
  const bookingRows = (bookings.data ?? []) as Array<Record<string, string>>;
  const sponsorRows = (sponsorships.data ?? []) as Array<Record<string, string>>;

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.inner}`}>
          <p className={styles.kicker}>Admin</p>
          <h1>Admin dashboard</h1>
          <p style={{ marginTop: "0.5rem" }}>
            <Link href="/admin/taxonomy" style={{ color: "var(--p-azure-deep)", fontWeight: 600 }}>
              Manage services &amp; locations →
            </Link>
          </p>

          <div className={styles.stats}>
            <Stat label="Listings" value={svc.length} />
            <Stat label="Published" value={svc.filter((s) => s.status === "published").length} />
            <Stat label="Enquiries" value={enq.length} />
            <Stat label="Referrals" value={refs.length} />
            <Stat label="Partnerships" value={parts.length} />
            <Stat label="Active sponsors" value={sponsorRows.filter((s) => s.status === "active").length} />
          </div>

          {/* Listings moderation */}
          <h2 className={styles.sectionTitle}>Listings</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Title</th><th>Seller</th><th>Status</th><th>Trusted</th><th>Created</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {svc.length === 0 && <tr><td colSpan={6} className={styles.emptyCell}>No listings yet.</td></tr>}
                {svc.map((s) => (
                  <tr key={s.id}>
                    <td><Link href={`/directory/${s.slug}`} target="_blank">{s.title}</Link></td>
                    <td>{s.profiles?.display_name ?? "—"}</td>
                    <td><span className={styles.badge}>{s.status}</span></td>
                    <td>{s.is_featured ? <span className={`${styles.badge} ${styles.badgeTrusted}`}>Trusted</span> : "—"}</td>
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
