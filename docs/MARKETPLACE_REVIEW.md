# Marketplace & payments — security review guide

This is a guide for an independent reviewer looking at the money-handling code
before we switch Stripe from **test** to **live** keys. It explains the model,
maps the files, lists exactly what to scrutinise, and gives a test-mode
walkthrough.

> **Hard rule:** no live Stripe keys until this review is signed off.

Everything below runs today in **Stripe test mode** and is already merged to
`main`. Nothing here has ever touched real money.

---

## 1. The model in one paragraph

Plistic is an **escrow marketplace**. A buyer pays the **platform** Stripe
account (not the seller). The funds are **held** — no `transfer_data` /
`on_behalf_of` on the charge — until the order reaches a terminal state. When
the seller marks the order delivered and the buyer confirms (or 14 days pass
with no dispute), the platform **transfers the seller's share** (order total
minus commission) to the seller's **Stripe Connect Express** account. Commission
is 10% standard / 5% for featured members, **snapshotted onto the order** at
purchase so later rate changes never affect in-flight orders.

There are two things a buyer can pay for, and they share this one pipeline:

| Product of sale | Entry point | Table row |
|---|---|---|
| A **bookable package** (a service listing's tier) | `service_packages.is_bookable` | `orders.package_id` |
| A **marketplace item** (physical good or fixed service) | `products` (status `active`) | `orders.product_id` |

Both create an `orders` row and go through the **same** lifecycle, webhook,
release logic, dashboards, disputes and reviews. The marketplace work (Phase 3)
added `product_id` / `quantity` / `ship_to` to `orders` and a second checkout
route — it did **not** fork the money-path.

---

## 2. Order lifecycle (state machine)

```
pending ──(checkout.session.completed webhook)──▶ in_progress
in_progress ──(seller: markDelivered)──▶ delivered
delivered ──(buyer: confirmReceipt)─────▶ completed   ──▶ payout transfer
delivered ──(cron: 14d auto-release)────▶ completed   ──▶ payout transfer
in_progress|delivered ──(buyer: raiseDispute)──▶ disputed   (excluded from auto-release; admin mediates)
```

- **Money in:** `pending → in_progress` happens **only** from the signed Stripe
  webhook, never from client code.
- **Money out:** `delivered → completed` is the only path that creates a Stripe
  transfer, and it is guarded (see §5).

---

## 3. File map (what to read, in order)

**Server-side Stripe client**
- `src/lib/stripe.ts` — single Stripe client, secret key server-only.

**Checkout (creates the order + Checkout Session)**
- `src/app/api/stripe/orders/checkout/route.ts` — bookable **package** checkout.
- `src/app/api/stripe/marketplace/checkout/route.ts` — marketplace **item**
  checkout (the Phase 3 addition). Mirrors the package route; adds quantity,
  stock cap, and GB shipping-address collection for physical goods.

**Webhook (the only writer of "paid")**
- `src/app/api/webhooks/stripe/route.ts`
  - `markOrderPaid()` — `pending → in_progress`, records payment intent,
    captures `ship_to` for physical goods, and `decrementStock()`.
  - `syncConnectAccount()` — sets `profiles.payouts_enabled` from
    `account.updated`.
  - `syncSubscription()` — featured-member subscriptions (separate concern).

**Release (the only mover of money out)**
- `src/lib/orders.ts`
  - `releaseOrder()` — creates the Stripe transfer to the seller, records the
    payout, completes the order. Idempotent (see §5).
  - `sweepAutoReleases()` — batch auto-release of delivered orders past their
    window. Called from the daily cron in
    `src/app/api/cron/ratings/route.ts` (protected by `CRON_SECRET`).

**Buyer/seller actions (state transitions)**
- `src/app/dashboard/orders/actions.ts` — `markDelivered`, `confirmReceipt`,
  `raiseDispute`, `leaveReview`. Orders are read-only to clients (RLS); every
  transition is a server action with an explicit party check.

**Seller onboarding**
- `src/app/api/stripe/connect/onboard/route.ts` — Stripe Connect Express
  onboarding link. A seller can't be paid (and "Buy now" won't show) until
  `payouts_enabled` is true.

**UI gates**
- `src/app/marketplace/[id]/page.tsx` — `buyable` gate (price set, in stock,
  seller `payouts_enabled`); otherwise "Enquire".
- `src/app/marketplace/[id]/BuyItemButton.tsx` — client fetch → redirect to
  Stripe.

**Schema + RLS**
- `supabase/migrations/0011_connect.sql` — Connect fields on `profiles`.
- `supabase/migrations/0012_orders.sql` — `orders`, `order_events`, RLS.
- `supabase/migrations/0013_payouts.sql` — `payouts`.
- `supabase/migrations/0030_products.sql` — `products`, `product_media`, RLS.
- `supabase/migrations/0031_marketplace_orders.sql` — `orders.product_id`,
  `quantity`, `ship_to`, `fulfilment`.

---

## 4. Trust boundary (the important bit)

**The client never sends money amounts.** The marketplace checkout accepts only
`{ productId, quantity }`. Everything financial is read server-side:

- Unit price ← `products.price_gbp` (DB).
- Commission rate ← whether the seller has an active `sponsorships` row.
- `amount_gbp`, `commission_gbp` ← computed server-side and stored on the order.

Amount integrity: `price_gbp` is `numeric(10,2)`, so `round(unit×100)` is exact
pence. Stripe charges `round(unit×100) × quantity`; the stored `amount_gbp ×
100` equals that exactly — no drift between what Stripe collects and what we
record.

---

## 5. Guards to verify (review checklist)

**Checkout — `marketplace/checkout/route.ts`**
- [ ] Signed-in buyer required (401 `code: "signin"` otherwise).
- [ ] Rate-limited per IP.
- [ ] Returns 503 if `STRIPE_SECRET_KEY` unset (no accidental prod path).
- [ ] Product must be `status = 'active'`; parent service `published`.
- [ ] Rejects price-on-enquiry (`price_gbp` null / ≤ 0).
- [ ] `quantity` clamped to `[1, 50]` and `≤ stock` when stock is tracked.
- [ ] Seller ≠ buyer.
- [ ] Seller must have `payouts_enabled` **and** a Connect account id.
- [ ] Order minted **before** the Session so `order_id` tags the charge
      (`transfer_group`, `payment_intent_data.metadata.order_id`).

**Webhook — `webhooks/stripe/route.ts`**
- [ ] Signature verified with `STRIPE_WEBHOOK_SECRET`; bad signature → 400.
- [ ] `markOrderPaid` only acts on a **still-`pending`** order (idempotent
      against duplicate webhook deliveries).
- [ ] `decrementStock` floors at 0 and marks `sold`; no-op for made-to-order
      (null stock).

**Release — `orders.ts`**
- [ ] Acts only on a `delivered` order.
- [ ] Duplicate-payout guard: existing `payouts.order_id` row blocks a second
      transfer; `idempotencyKey: order_release_${orderId}` on the transfer.
- [ ] `source_transaction` ties the transfer to the original charge (so it
      succeeds against settling funds; in live mode settlement takes days).
- [ ] Seller share = `amount_gbp − commission_gbp`; verify the arithmetic and
      that commission is the **snapshot** on the order, not a live lookup.

**RLS / authorization**
- [ ] `orders` / `order_events`: buyers and sellers can only **read** their own;
      **no client write policy** (all writes via service role).
- [ ] Every server action re-checks `buyer_id` / `seller_id` against the
      session user before mutating.
- [ ] `products` / `product_media`: public read only when `active` + parent
      `published`; owner-manage scoped by `services.seller_id = auth.uid()`.

**Known caveats (already flagged — confirm the risk call)**
- [ ] **Stock oversell window:** stock is decremented on payment success
      (webhook), not at checkout creation, so two simultaneous buyers of the
      last unit can both pay. Judged acceptable at current volume; a reviewer
      may prefer a reserve-at-checkout or a DB-level atomic decrement.
- [ ] **Shipping capture:** `ship_to` reads `shipping_details` /
      `collected_information.shipping_details` from the completed Session (dual
      fallback across API versions). If Stripe omits it, `ship_to` is null and
      the seller sees no address — degrade, don't crash.

---

## 6. Test-mode walkthrough (end to end)

You need: test `STRIPE_SECRET_KEY`, test `STRIPE_WEBHOOK_SECRET`, and the Stripe
CLI for local webhooks (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`).

1. **Onboard a test seller.** As a seller account, complete Stripe Connect
   Express onboarding (`/api/stripe/connect/onboard`). Use Stripe's test
   onboarding values. Confirm `profiles.payouts_enabled` flips true via the
   `account.updated` webhook.
2. **List an item.** Dashboard → listing → *Items for sale* → add an item, set a
   price + a small stock, add a photo, set status **Active**.
3. **Buy it.** As a **different** signed-in account, open the item in
   `/marketplace/[id]` → **Buy now**. Card `4242 4242 4242 4242`, any future
   expiry / CVC. For a physical item, enter a test shipping address.
4. **Verify "money in".** Order appears in the buyer's **My orders** and the
   seller's **Sales** as *To deliver*. `order_events` has a `paid` row. Stock
   decremented (item flips to `sold` if it hit 0). Ship-to address shows on the
   seller's Sales row.
5. **Deliver + confirm.** Seller → **Mark delivered**. Buyer → **Confirm
   received**. `releaseOrder` fires: a Stripe **transfer** to the connected
   account, a `payouts` row, order `completed`.
6. **Check idempotency.** Re-send the `checkout.session.completed` event
   (`stripe events resend …`) — the order must **not** double-process.
7. **Auto-release path.** Mark another order delivered, back-date
   `auto_release_at`, hit the cron with the `CRON_SECRET` header, confirm it
   releases and doesn't touch disputed/completed orders.
8. **Dispute path.** On an in-progress order, buyer raises an issue → order
   `disputed`, excluded from auto-release, admin notified.

Test cards: success `4242 4242 4242 4242`; decline `4000 0000 0000 0002`.

---

## 7. Go-live checklist (only after sign-off)

- [ ] Review signed off (this document).
- [ ] Live `STRIPE_SECRET_KEY` and live `STRIPE_WEBHOOK_SECRET` set in Vercel
      (Production env) — never in the repo or in chat.
- [ ] Live webhook endpoint registered in the Stripe dashboard →
      `/api/webhooks/stripe`, subscribed to `checkout.session.completed`,
      `account.updated`, and the `customer.subscription.*` events.
- [ ] Connect **live** onboarding enabled; platform Connect settings + payout
      schedule reviewed.
- [ ] Real card, small real purchase, end-to-end incl. payout — then refunded.
- [ ] Terms / escrow disclosure wording confirmed (Plistic holds funds but is
      not a party to the work).

---

## 8. Out of scope for this change

- Featured-member subscriptions (`sponsorships`, `syncSubscription`) — separate,
  pre-existing.
- A multi-seller basket. Today it's one item per checkout ("Buy now"), which
  keeps one order = one seller = one payout and avoids splitting a single charge
  across Connect accounts.
