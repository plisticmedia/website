# Peer network & peer feedback — design + status

A B2B trust layer for the directory, **separate from client reviews** (which are
order-gated buyer→seller). Goal: map who has worked with whom, and capture honest
peer sentiment — including negatives — **without publishing anything defamatory**.

## The three layers

### Layer 1 — Verified collaborations ("worked with") — BUILT, LIVE-SAFE
- A business declares it worked with another (`peer_connections`, status `pending`).
- The other business **confirms** (or declines). Only **mutually-confirmed** links show.
- Shown publicly on both profiles as a "Worked with" chip list.
- Managed at **Dashboard → My network**: add, confirm incoming, cancel/remove.
- **Why it's safe:** it's a factual, mutually-agreed statement of collaboration. No rating, no opinion, no negative.

### Layer 3 — Private peer feedback — BUILT, PRIVATE ONLY
- Only between businesses with a **confirmed** connection.
- Structured: "Would you work with them again?" (yes/mixed/no) + optional 1–5 on
  reliability, communication, quality + an optional private note.
- **Never published.** RLS restricts reads to the rater and admins. Surfaced only
  in **Admin → Peer feedback (private)** so the operator can steer who to feature/recommend.
- **Why it's safe:** it isn't published to third parties. It's an internal signal.
  This is the "would have saved us hassle" mechanism — it protects users by
  informing curation, not by publishing accusations.

### Layer 2 — Public "peer confidence" aggregate — SPEC'D, NOT BUILT / OFF
The valuable-but-sensitive bit. **Deliberately not built for public display yet** —
gated behind sign-off from a legal advice session. When/if enabled it would:
- Show an **aggregate only**, and **only above a volume threshold** (e.g. ≥4–5 raters)
  so no individual is identifiable and one grudge can't tank someone. Below threshold:
  "Not enough peer feedback yet."
- Be **honest**, including bad numbers (e.g. "45% would work again (n=9)") — no whitewash.
- Show only to **logged-in verified businesses** weighing a collaboration — not the
  open public / competitors / press.
- Include a **right of reply** and a dispute/flag route for the rated business.
- Never expose free-text or an individual's rating publicly.

## Data model (migration `0025_peer_network.sql`)
- `peer_connections` (requester_service_id, peer_service_id, status, note, confirmed_at).
  RLS: public read of confirmed links between published listings; either owner reads
  their own; writes server-side only.
- `peer_feedback` (rater_service_id, subject_service_id, would_work_again, reliability,
  communication, quality, private_note). RLS: **read only by the rater or an admin** —
  no public read. Writes server-side only, and only where a confirmed connection exists.

## Anti-abuse
- Only **verified/claimed, published** businesses participate.
- Feedback requires a **confirmed collaboration** (can't rate someone you never worked with).
- One feedback row per rater→subject (updatable); one connection per pair (either direction).
- All writes are server actions with explicit ownership checks (service role).

## Before Layer 2 goes public (the gate)
- Free legal advice session (see `PEER_NETWORK_LEGAL_BRIEF.md`).
- Terms of Service clauses: opinion framing, right of reply, notice-and-takedown, operator liability.
- GDPR: feedback about identifiable businesses/sole traders is personal data — lawful basis,
  transparency, subject-access/erasure handling.
- Only after sign-off: build the aggregate display + right-of-reply, behind a feature flag.
