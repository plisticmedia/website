import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { confirmReceipt, leaveReview, raiseDispute, requestChanges } from "./actions";
import { declineCustomOffer } from "./offer-actions";
import { approveMilestone } from "./actions";
import { OfferPayButton } from "./OfferPayButton";
import { TestPaymentNote } from "@/components/TestPaymentNote";
import styles from "./Orders.module.css";

function gbpOffer(v: number | null | undefined) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(v ?? 0));
}

type OfferRow = {
  id: string;
  title: string;
  description: string | null;
  price_gbp: number;
  revision_limit: number | null;
  delivery_days: number | null;
  milestones: Array<{ title: string; amount_gbp: number }> | null;
  services: { title: string | null; slug: string | null } | null;
};

type MilestoneRow = {
  id: string;
  order_id: string;
  title: string;
  amount_gbp: number;
  status: string;
  sort_order: number;
};

const MSTONE_LABEL: Record<string, string> = {
  pending: "In progress",
  delivered: "Ready to approve",
  released: "Approved & paid",
  disputed: "Issue raised",
};

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
  quantity: number | null;
  revision_limit: number | null;
  services: { title: string | null; slug: string | null } | null;
  products: { title: string | null } | null;
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; msg?: string; err?: string }>;
}) {
  const profile = await requireUser("/dashboard/orders");
  const { order, msg, err } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("orders")
    .select("id, status, amount_gbp, created_at, quantity, revision_limit, services ( title, slug ), products ( title )")
    .eq("buyer_id", profile.id)
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as unknown as OrderRow[];

  // Which orders the buyer has already reviewed (to hide the review form).
  const { data: reviewRows } = await supabase.from("reviews").select("order_id").eq("buyer_id", profile.id);
  const reviewed = new Set(((reviewRows ?? []) as { order_id: string }[]).map((r) => r.order_id));

  // Latest "changes requested" note per order, so a reworked order shows what
  // the buyer asked for. RLS lets a buyer read their own orders' events.
  const orderIds = orders.map((o) => o.id);
  const changeNotes = new Map<string, string>();
  const revisionsUsed = new Map<string, number>();
  if (orderIds.length > 0) {
    const { data: eventRows } = await supabase
      .from("order_events")
      .select("order_id, data, created_at")
      .eq("type", "changes_requested")
      .in("order_id", orderIds)
      .order("created_at", { ascending: false });
    for (const e of (eventRows ?? []) as { order_id: string; data: { notes?: string } }[]) {
      if (!changeNotes.has(e.order_id) && e.data?.notes) changeNotes.set(e.order_id, e.data.notes);
      revisionsUsed.set(e.order_id, (revisionsUsed.get(e.order_id) ?? 0) + 1);
    }
  }

  // Custom offers the buyer has been sent and not yet acted on.
  const { data: offerData } = await supabase
    .from("custom_offers")
    .select("id, title, description, price_gbp, revision_limit, delivery_days, milestones, services ( title, slug )")
    .eq("buyer_id", profile.id)
    .eq("status", "sent")
    .order("created_at", { ascending: false });
  const offers = (offerData ?? []) as unknown as OfferRow[];

  // Milestones for any staged orders the buyer has, grouped by order.
  const milestonesByOrder = new Map<string, MilestoneRow[]>();
  if (orderIds.length > 0) {
    const { data: msRows } = await supabase
      .from("order_milestones")
      .select("id, order_id, title, amount_gbp, status, sort_order")
      .in("order_id", orderIds)
      .order("sort_order", { ascending: true });
    for (const m of (msRows ?? []) as MilestoneRow[]) {
      const list = milestonesByOrder.get(m.order_id) ?? [];
      list.push(m);
      milestonesByOrder.set(m.order_id, list);
    }
  }

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
              Bookings and items you&apos;ve bought. Your payment is held securely and released to the seller once you
              confirm it&apos;s delivered (or automatically after 14 days). If a delivered order isn&apos;t quite right,
              you can send it back with notes before confirming.
            </p>
          </div>

          {order === "success" && (
            <p className={styles.banner} role="status">
              Payment received — your order is confirmed. The supplier has been notified.
            </p>
          )}
          {msg && (
            <p className={styles.banner} role="status">{msg}</p>
          )}
          {err && (
            <p className={styles.bannerErr} role="alert">{err}</p>
          )}

          {offers.length > 0 && (
            <div className={styles.offersBlock}>
              <h2 className={styles.offersTitle}>Custom offers for you</h2>
              <p className={styles.offersLead}>
                A seller has sent you a one-off offer. Accept and pay to start it — your payment is held securely and
                only released once it&apos;s delivered.
              </p>
              <ul className={styles.list}>
                {offers.map((of) => (
                  <li key={of.id} className={styles.order}>
                    <div className={styles.orderMain}>
                      <h2>{of.title}</h2>
                      {of.services?.slug ? (
                        <p className={styles.orderMeta}>
                          from <Link href={`/directory/${of.services.slug}`}>{of.services.title ?? "the seller"}</Link>
                        </p>
                      ) : null}
                      {of.description && <p className={styles.offerDesc}>{of.description}</p>}
                      {of.milestones && of.milestones.length > 0 && (
                        <div className={styles.offerStages}>
                          <p className={styles.offerStagesTitle}>Paid in {of.milestones.length} stages:</p>
                          <ul>
                            {of.milestones.map((m, i) => (
                              <li key={i}>
                                <span>{m.title}</span>
                                <span>{gbpOffer(m.amount_gbp)}</span>
                              </li>
                            ))}
                          </ul>
                          <p className={styles.offerStagesNote}>
                            You pay the total up front; each stage is released to the seller only as you approve it.
                          </p>
                        </div>
                      )}
                      <p className={styles.orderMeta}>
                        {of.revision_limit != null
                          ? `Includes ${of.revision_limit} revision${of.revision_limit === 1 ? "" : "s"}`
                          : ""}
                        {of.revision_limit != null && of.delivery_days != null ? " · " : ""}
                        {of.delivery_days != null ? `${of.delivery_days} day delivery` : ""}
                      </p>
                    </div>
                    <div className={styles.orderSide}>
                      <span className={styles.amount}>{gbpOffer(of.price_gbp)}</span>
                      <OfferPayButton offerId={of.id} priceLabel={gbpOffer(of.price_gbp)} />
                      <form action={declineCustomOffer.bind(null, of.id)}>
                        <button type="submit" className={styles.linkBtn}>Decline</button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
              <TestPaymentNote />
            </div>
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
                    {o.products?.title && (
                      <p className={styles.orderItem}>
                        {o.products.title}
                        {Number(o.quantity) > 1 ? ` × ${Number(o.quantity)}` : ""}
                      </p>
                    )}
                    <p className={styles.orderMeta}>{new Date(o.created_at).toLocaleDateString("en-GB")}</p>
                  </div>
                  <div className={styles.orderSide}>
                    <span className={styles.amount}>{gbp(o.amount_gbp)}</span>
                    <span className={`${styles.status} ${styles[`status_${o.status}`] ?? ""}`}>
                      {LABEL[o.status] ?? o.status}
                    </span>
                    {o.status === "delivered" && !milestonesByOrder.has(o.id) && (
                      <form action={confirmReceipt.bind(null, o.id)}>
                        <button type="submit" className="p-btn">Confirm received</button>
                      </form>
                    )}
                  </div>
                  {milestonesByOrder.has(o.id) && (
                    <ul className={styles.stageList}>
                      {(milestonesByOrder.get(o.id) ?? []).map((m) => (
                        <li key={m.id} className={styles.stageItem}>
                          <span>
                            <strong>{m.title}</strong> · {gbp(m.amount_gbp)}
                          </span>
                          <span className={styles.stageSide}>
                            <span className={`${styles.status} ${styles[`mstatus_${m.status}`] ?? ""}`}>
                              {MSTONE_LABEL[m.status] ?? m.status}
                            </span>
                            {m.status === "delivered" && (
                              <form action={approveMilestone.bind(null, m.id)}>
                                <button type="submit" className="p-btn">Approve &amp; release</button>
                              </form>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {o.status === "in_progress" && changeNotes.has(o.id) && (
                    <p className={styles.changeHint}>
                      Changes requested — the seller is updating your order and will re-deliver it.
                    </p>
                  )}
                  {o.status === "delivered" &&
                    (() => {
                      const limit = o.revision_limit;
                      const used = revisionsUsed.get(o.id) ?? 0;
                      const capReached = limit != null && used >= limit;
                      if (capReached) {
                        return (
                          <p className={styles.changeHint}>
                            {limit === 0
                              ? "This order doesn't include revisions."
                              : `You've used all ${limit} included revision${limit === 1 ? "" : "s"}.`}{" "}
                            {o.services?.slug ? (
                              <Link href={`/directory/${o.services.slug}#enquire`}>Message the seller</Link>
                            ) : (
                              "Message the seller"
                            )}{" "}
                            to arrange any further changes.
                          </p>
                        );
                      }
                      return (
                        <details className={styles.dispute}>
                          <summary>
                            Not quite right? Request changes
                            {limit != null ? ` (${limit - used} of ${limit} left)` : ""}
                          </summary>
                          <form action={requestChanges.bind(null, o.id)} className={styles.disputeForm}>
                            <textarea
                              name="notes"
                              rows={2}
                              maxLength={2000}
                              placeholder="Describe the changes you'd like — this goes back to the seller to put right."
                              required
                            />
                            <button type="submit" className="p-btn p-btn--ghost">Send back for changes</button>
                          </form>
                        </details>
                      );
                    })()}
                  {(o.status === "in_progress" || o.status === "delivered") && (
                    <details className={styles.dispute}>
                      <summary>Something seriously wrong? Report a problem</summary>
                      <form action={raiseDispute.bind(null, o.id)} className={styles.disputeForm}>
                        <textarea name="reason" rows={2} maxLength={2000} placeholder="Tell us what went wrong — Plistic will step in to help." required />
                        <button type="submit" className="p-btn p-btn--ghost">Raise issue</button>
                      </form>
                    </details>
                  )}
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
