import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { ActionButton } from "@/components/ActionButton";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { DISCOUNT_SERVICE_LABELS, discountSummary, type DiscountService } from "@/lib/discounts";
import { DiscountForm } from "./DiscountForm";
import { setDiscountActive, deleteDiscountCode } from "./actions";
import styles from "../Admin.module.css";

export const metadata: Metadata = { title: "Discount codes | Plistic admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  code: string;
  label: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  service: string;
  active: boolean;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
  created_at: string;
};

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function serviceLabel(service: string) {
  return DISCOUNT_SERVICE_LABELS[service as DiscountService] ?? service;
}

export default async function DiscountCodesPage() {
  await requireAdmin();
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("discount_codes")
    .select("id, code, label, discount_type, discount_value, service, active, expires_at, max_uses, used_count, created_at")
    .order("created_at", { ascending: false });
  const codes = (data ?? []) as Row[];

  const now = Date.now();

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.inner}`}>
          <p className={styles.kicker}>Admin</p>
          <h1>Discount codes</h1>
          <p style={{ marginTop: "0.5rem" }}>
            <Link href="/admin" style={{ color: "var(--p-azure-deep)", fontWeight: 600 }}>
              ← Back to admin dashboard
            </Link>
          </p>
          <p style={{ margin: "0 0 1.2rem", fontSize: "0.92rem", color: "var(--p-muted)", lineHeight: 1.55, maxWidth: "68ch" }}>
            Create quote codes (like the <strong>EVENT50</strong> card offer). A customer enters the code in the pricing
            estimator; if it&apos;s valid the estimate shows the discounted price, and the code comes through with their
            enquiry so you know to honour it on the quote. Turn a code off to stop it working without deleting its history.
          </p>

          {/* Create a code */}
          <div style={{ border: "1px solid var(--p-line)", borderRadius: 12, padding: "1rem 1.1rem", marginBottom: "1.4rem" }}>
            <h3 style={{ margin: 0 }}>Create a code</h3>
            <DiscountForm buttonClassName={styles.btnSmall} />
          </div>

          {/* Existing codes */}
          <h2 className={styles.sectionTitle}>Codes ({codes.length})</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Applies to</th>
                  <th>Status</th>
                  <th>Expires</th>
                  <th>Used</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {codes.length === 0 && (
                  <tr>
                    <td colSpan={7} className={styles.emptyCell}>
                      No codes yet — create one above.
                    </td>
                  </tr>
                )}
                {codes.map((c) => {
                  const expired = c.expires_at != null && new Date(c.expires_at).getTime() < now;
                  const usedUp = c.max_uses != null && c.used_count >= c.max_uses;
                  const status = !c.active ? "Off" : expired ? "Expired" : usedUp ? "Fully used" : "Live";
                  return (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.code}</strong>
                        {c.label ? <div className={styles.note}>{c.label}</div> : null}
                      </td>
                      <td>{discountSummary({ discountType: c.discount_type, discountValue: Number(c.discount_value) })}</td>
                      <td>{serviceLabel(c.service)}</td>
                      <td>{status}</td>
                      <td>{fmt(c.expires_at)}</td>
                      <td>
                        {c.used_count}
                        {c.max_uses != null ? ` / ${c.max_uses}` : ""}
                      </td>
                      <td className={styles.actions}>
                        <ActionButton
                          action={setDiscountActive.bind(null, c.id, !c.active)}
                          pendingText="…"
                          className={styles.btnSmall}
                        >
                          {c.active ? "Turn off" : "Turn on"}
                        </ActionButton>
                        <ActionButton
                          action={deleteDiscountCode.bind(null, c.id)}
                          pendingText="Deleting…"
                          className={`${styles.btnSmall} ${styles.btnDanger}`}
                          confirm={`Delete ${c.code}? This can't be undone.`}
                        >
                          Delete
                        </ActionButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
