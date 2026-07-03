import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { confirmReceipt, leaveReview } from "./actions";
import styles from "./Orders.module.css";

export const metadata: Metadata = { title: "My orders | Plistic" };
export const dynamic = "force-dynamic";

function gbp(v: number | null | undefined) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(v ?? 0));
}

const LABEL: Record<string, string> = {
  pending: "Awaiting payment",
  in_progress: "In progress",
  delivered: "Delivered — confirm",
  completed: "Completed",
  disputed: "Issue raised",
  refunded: "Refunded",
  canceled: "Cancelled",
};

type OrderRow = {
  id: string;
  status: string;
  amount_gbp: number;
  created_at: string;
  services: { title: string | null; slug: string | null } | null;
};

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const profile = await requireUser("/dashboard/orders");
  const { order } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("orders")
    .select("id, status, amount_gbp, created_at, services ( title, slug )")
    .eq("buyer_id", profile.id)
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as unknown as OrderRow[];

  // Which orders the buyer has already reviewed (to hide the review form).
  const { data: reviewRows } = await supabase.from("reviews").select("order_id").eq("buyer_id", profile.id);
  const reviewed = new Set(((reviewRows ?? []) as { order_id: string }[]).map((r) => r.order_id));

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className="p-container">
          <p className={styles.kicker}>
            <Link href="/dashboard">Dashboard</Link> / My orders
          </p>
          <div className={styles.head}>
            <h1>My orders</h1>
            <p className={styles.lead}>
              Services you&apos;ve booked. Your payment is held securely and released to the supplier once you
              confirm the work is done (or automatically after 14 days).
            </p>
          </div>

          {order === "success" && (
            <p className={styles.banner} role="status">
              Payment received — your order is confirmed. The supplier has been notified.
            </p>
          )}

          {orders.length === 0 ? (
            <p className={styles.empty}>You haven&apos;t booked anything yet.</p>
          ) : (
            <ul className={styles.list}>
              {orders.map((o) => (
                <li key={o.id} className={styles.order}>
                  <div className={styles.orderMain}>
                    <h2>
                      {o.services?.slug ? (
                        <Link href={`/directory/${o.services.slug}`}>{o.services.title ?? "Listing"}</Link>
                      ) : (
                        o.services?.title ?? "Listing"
                      )}
                    </h2>
                    <p className={styles.orderMeta}>{new Date(o.created_at).toLocaleDateString("en-GB")}</p>
                  </div>
                  <div className={styles.orderSide}>
                    <span className={styles.amount}>{gbp(o.amount_gbp)}</span>
                    <span className={`${styles.status} ${styles[`status_${o.status}`] ?? ""}`}>
                      {LABEL[o.status] ?? o.status}
                    </span>
                    {o.status === "delivered" && (
                      <form action={confirmReceipt.bind(null, o.id)}>
                        <button type="submit" className="p-btn">Confirm received</button>
                      </form>
                    )}
                  </div>
                  {o.status === "completed" && !reviewed.has(o.id) && (
                    <form action={leaveReview.bind(null, o.id)} className={styles.reviewForm}>
                      <label>
                        <span>Rate your experience</span>
                        <select name="rating" defaultValue="5" required>
                          <option value="5">★★★★★ Excellent</option>
                          <option value="4">★★★★ Good</option>
                          <option value="3">★★★ Okay</option>
                          <option value="2">★★ Poor</option>
                          <option value="1">★ Bad</option>
                        </select>
                      </label>
                      <textarea name="body" rows={2} maxLength={2000} placeholder="Share a few words about the work (optional)" />
                      <button type="submit" className="p-btn p-btn--ghost">Leave review</button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
