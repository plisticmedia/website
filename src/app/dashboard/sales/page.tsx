import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { markDelivered } from "../orders/actions";
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
