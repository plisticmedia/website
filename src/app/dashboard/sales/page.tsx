import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { markDelivered } from "../orders/actions";
import { sendCustomOffer, cancelCustomOffer } from "../orders/offer-actions";
import styles from "../orders/Orders.module.css";

export const metadata: Metadata = { title: "Sales | Plistic" };
export const dynamic = "force-dynamic";

function gbp(v: number | null | undefined) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(v ?? 0));
}

const LABEL: Record<string, string> = {
  pending: "Awaiting payment",
  in_progress: "To deliver",
  delivered: "Awaiting confirmation",
  completed: "Paid out",
  disputed: "Issue raised",
  refunded: "Refunded",
  canceled: "Cancelled",
};

type ShipTo = {
  name?: string | null;
  address?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    postal_code?: string | null;
    state?: string | null;
    country?: string | null;
  } | null;
} | null;

type SaleRow = {
  id: string;
  status: string;
  amount_gbp: number;
  commission_gbp: number;
  created_at: string;
  quantity: number | null;
  ship_to: ShipTo;
  services: { title: string | null; slug: string | null } | null;
  products: { title: string | null } | null;
};

type OfferRow = {
  id: string;
  parent_order_id: string | null;
  title: string;
  price_gbp: number;
  status: string;
  created_at: string;
};

const OFFER_LABEL: Record<string, string> = {
  sent: "Sent — awaiting buyer",
  accepted: "Accepted & paid",
  declined: "Declined",
  cancelled: "Withdrawn",
  expired: "Expired",
};

function formatAddress(ship: ShipTo): string | null {
  if (!ship) return null;
  const a = ship.address ?? {};
  const parts = [ship.name, a.line1, a.line2, a.city, a.state, a.postal_code, a.country].filter(
    (p): p is string => typeof p === "string" && p.trim().length > 0,
  );
  return parts.length > 0 ? parts.join(", ") : null;
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; err?: string }>;
}) {
  const profile = await requireUser("/dashboard/sales");
  const { msg, err } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "id, status, amount_gbp, commission_gbp, created_at, quantity, ship_to, services ( title, slug ), products ( title )",
    )
    .eq("seller_id", profile.id)
    .order("created_at", { ascending: false });
  const sales = (data ?? []) as unknown as SaleRow[];

  // Latest "changes requested" note per order, so a reworked order shows the
  // seller exactly what the buyer asked to be adjusted.
  const orderIds = sales.map((s) => s.id);
  const changeNotes = new Map<string, string>();
  if (orderIds.length > 0) {
    const { data: eventRows } = await supabase
      .from("order_events")
      .select("order_id, data, created_at")
      .eq("type", "changes_requested")
      .in("order_id", orderIds)
      .order("created_at", { ascending: false });
    for (const e of (eventRows ?? []) as { order_id: string; data: { notes?: string } }[]) {
      if (!changeNotes.has(e.order_id) && e.data?.notes) changeNotes.set(e.order_id, e.data.notes);
    }
  }

  // Custom offers this seller has sent, grouped by the order they relate to, so
  // each order can show its offer history and status.
  const offersByOrder = new Map<string, OfferRow[]>();
  {
    const { data: offerRows } = await supabase
      .from("custom_offers")
      .select("id, parent_order_id, title, price_gbp, status, created_at")
      .eq("seller_id", profile.id)
      .order("created_at", { ascending: false });
    for (const o of (offerRows ?? []) as OfferRow[]) {
      if (!o.parent_order_id) continue;
      const list = offersByOrder.get(o.parent_order_id) ?? [];
      list.push(o);
      offersByOrder.set(o.parent_order_id, list);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className="p-container">
          <p className={styles.kicker}>
            <Link href="/dashboard">Dashboard</Link> / Sales
          </p>
          {msg && <p className={styles.banner} role="status">{msg}</p>}
          {err && <p className={styles.bannerErr} role="alert">{err}</p>}

          <div className={styles.head}>
            <h1>Sales</h1>
            <p className={styles.lead}>
              Orders buyers have placed — bookings and marketplace items. Once you&apos;ve delivered or shipped it,
              mark it delivered; funds are released to you when the buyer confirms, or automatically after 14 days.
              Plistic&apos;s commission is deducted from the payout.
            </p>
          </div>

          {sales.length === 0 ? (
            <p className={styles.empty}>
              No sales yet. Make a package bookable or add marketplace items to start taking paid orders.
            </p>
          ) : (
            <ul className={styles.list}>
              {sales.map((s) => {
                const net = Number(s.amount_gbp) - Number(s.commission_gbp);
                const itemName = s.products?.title ?? null;
                const qty = Number(s.quantity) || 1;
                const address = formatAddress(s.ship_to);
                return (
                  <li key={s.id} className={styles.order}>
                    <div className={styles.orderMain}>
                      <h2>
                        {s.services?.slug ? (
                          <Link href={`/directory/${s.services.slug}`}>{s.services.title ?? "Listing"}</Link>
                        ) : (
                          s.services?.title ?? "Listing"
                        )}
                      </h2>
                      {itemName && (
                        <p className={styles.orderItem}>
                          {itemName}
                          {qty > 1 ? ` × ${qty}` : ""}
                        </p>
                      )}
                      <p className={styles.orderMeta}>
                        {new Date(s.created_at).toLocaleDateString("en-GB")} · you receive {gbp(net)} after commission
                      </p>
                      {address && (s.status === "in_progress" || s.status === "delivered") && (
                        <p className={styles.shipTo}>
                          <strong>Ship to:</strong> {address}
                        </p>
                      )}
                      {s.status === "in_progress" && changeNotes.has(s.id) && (
                        <p className={styles.changeNote}>
                          <strong>Changes requested:</strong> {changeNotes.get(s.id)}
                        </p>
                      )}
                    </div>
                    <div className={styles.orderSide}>
                      <span className={styles.amount}>{gbp(s.amount_gbp)}</span>
                      <span className={`${styles.status} ${styles[`status_${s.status}`] ?? ""}`}>
                        {LABEL[s.status] ?? s.status}
                      </span>
                      {s.status === "in_progress" && (
                        <form action={markDelivered.bind(null, s.id)}>
                          <button type="submit" className="p-btn">Mark delivered</button>
                        </form>
                      )}
                    </div>

                    {(offersByOrder.get(s.id) ?? []).length > 0 && (
                      <ul className={styles.offerHistory}>
                        {(offersByOrder.get(s.id) ?? []).map((o) => (
                          <li key={o.id}>
                            <span>
                              <strong>{o.title}</strong> · {gbp(o.price_gbp)} · {OFFER_LABEL[o.status] ?? o.status}
                            </span>
                            {o.status === "sent" && (
                              <form action={cancelCustomOffer.bind(null, o.id)}>
                                <button type="submit" className={styles.linkBtn}>Withdraw</button>
                              </form>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    <details className={styles.dispute}>
                      <summary>Send this buyer a custom offer</summary>
                      <form action={sendCustomOffer.bind(null, s.id)} className={styles.offerForm}>
                        <p className={styles.offerHint}>
                          A one-off priced offer just for this buyer — e.g. extra revisions or an add-on. They accept
                          and pay it from their orders page, held in escrow like any order.
                        </p>
                        <input name="title" type="text" required maxLength={160} placeholder="Title — e.g. 2 extra revisions" />
                        <textarea name="description" rows={2} maxLength={4000} placeholder="What's included (optional)" />
                        <div className={styles.offerRow}>
                          <input name="price_gbp" type="number" min="0.5" step="0.01" required placeholder="Price £" />
                          <input name="revision_limit" type="number" min="0" step="1" placeholder="Revisions (optional)" />
                          <input name="delivery_days" type="number" min="0" step="1" placeholder="Days (optional)" />
                        </div>
                        <button type="submit" className="p-btn p-btn--ghost">Send offer</button>
                      </form>
                    </details>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
