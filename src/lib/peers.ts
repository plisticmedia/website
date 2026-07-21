import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export type PeerBusiness = { id: string; title: string; slug: string; logo_url: string | null };

/**
 * Minimum number of raters before an aggregate is ever computed or shown — even
 * to the business itself — so no individual rater is identifiable.
 */
export const PEER_MIN_RATERS = 4;

/** Whether the public peer-confidence aggregate is switched on.
 *
 *  Two ways it can be on:
 *   1. During BETA (site behind the coming-soon gate, i.e. SITE_LIVE !== "true")
 *      it is on automatically, so beta testers can see it and give feedback.
 *   2. On the LIVE site it is OFF by default and only comes on if
 *      PEER_CONFIDENCE_PUBLIC=true is set — flip that ONLY after legal sign-off.
 *
 *  This means it turns itself off the moment the site goes live (SITE_LIVE=true),
 *  unless it has been explicitly re-enabled. It is always additionally gated on a
 *  logged-in viewer and the anonymity threshold (see getPublicPeerConfidence). */
export function peerConfidencePublic(): boolean {
  if (process.env.PEER_CONFIDENCE_PUBLIC === "true") return true;
  // Beta mode (coming-soon gate up): on for signed-in testers.
  return process.env.SITE_LIVE !== "true";
}

export type PeerConfidence = {
  count: number;
  wouldAgainPct: number; // % who said "yes"
  positivePct: number; // % "yes" or "mixed"
  reliability: number | null;
  communication: number | null;
  quality: number | null;
};

/**
 * Aggregate peer feedback for a business, or null if there aren't enough raters
 * to protect anonymity. Ignores the public flag and the admin hide switch — the
 * caller decides whether to display it (public vs the business's own view).
 */
export async function getPeerConfidence(serviceId: string): Promise<PeerConfidence | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("peer_feedback")
    .select("would_work_again, reliability, communication, quality")
    .eq("subject_service_id", serviceId);
  const rows = (data ?? []) as Array<{
    would_work_again: string;
    reliability: number | null;
    communication: number | null;
    quality: number | null;
  }>;
  if (rows.length < PEER_MIN_RATERS) return null;

  const count = rows.length;
  const yes = rows.filter((r) => r.would_work_again === "yes").length;
  const positive = rows.filter((r) => r.would_work_again !== "no").length;
  const avg = (key: "reliability" | "communication" | "quality") => {
    const vals = rows.map((r) => r[key]).filter((v): v is number => typeof v === "number");
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  };
  return {
    count,
    wouldAgainPct: Math.round((yes / count) * 100),
    positivePct: Math.round((positive / count) * 100),
    reliability: avg("reliability"),
    communication: avg("communication"),
    quality: avg("quality"),
  };
}

/** Confirmed collaborators of a listing (for the public profile "Worked with"). */
export async function getConfirmedCollaborators(serviceId: string): Promise<PeerBusiness[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data: conns } = await supabase
    .from("peer_connections")
    .select("requester_service_id, peer_service_id")
    .eq("status", "confirmed")
    .or(`requester_service_id.eq.${serviceId},peer_service_id.eq.${serviceId}`);
  const rows = (conns ?? []) as Array<{ requester_service_id: string; peer_service_id: string }>;
  const otherIds = rows.map((c) => (c.requester_service_id === serviceId ? c.peer_service_id : c.requester_service_id));
  if (otherIds.length === 0) return [];
  const { data: svcs } = await supabase
    .from("services")
    .select("id, title, slug, logo_url")
    .in("id", otherIds)
    .eq("status", "published");
  return (svcs ?? []) as PeerBusiness[];
}

/**
 * The peer-confidence block to show on a PUBLIC profile, or null. Applies every
 * gate: the feature flag, a logged-in viewer, the admin hide switch, and the
 * anonymity threshold. Returns the aggregate plus the business's right-of-reply.
 */
export async function getPublicPeerConfidence(
  serviceId: string,
  viewerLoggedIn: boolean,
): Promise<{ confidence: PeerConfidence; reply: string | null } | null> {
  if (!peerConfidencePublic() || !viewerLoggedIn) return null;
  const supabase = createSupabaseServiceRoleClient();
  const { data: svc } = await supabase
    .from("services")
    .select("peer_confidence_hidden, peer_reply")
    .eq("id", serviceId)
    .maybeSingle();
  const row = svc as { peer_confidence_hidden?: boolean; peer_reply?: string | null } | null;
  if (!row || row.peer_confidence_hidden) return null;
  const confidence = await getPeerConfidence(serviceId);
  if (!confidence) return null;
  return { confidence, reply: row.peer_reply ?? null };
}

/** A business's own peer standing (for their dashboard) — always visible to
 *  them above the anonymity threshold, regardless of the public flag. */
export async function getPeerStanding(
  serviceId: string,
): Promise<{ confidence: PeerConfidence | null; reply: string | null; hidden: boolean; disputedAt: string | null }> {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("services")
    .select("peer_reply, peer_confidence_hidden, peer_confidence_disputed_at")
    .eq("id", serviceId)
    .maybeSingle();
  const row = data as { peer_reply?: string | null; peer_confidence_hidden?: boolean; peer_confidence_disputed_at?: string | null } | null;
  return {
    confidence: await getPeerConfidence(serviceId),
    reply: row?.peer_reply ?? null,
    hidden: !!row?.peer_confidence_hidden,
    disputedAt: row?.peer_confidence_disputed_at ?? null,
  };
}

export type NetworkConnection = {
  id: string;
  status: string;
  note: string | null;
  mine: PeerBusiness; // which of my listings
  other: PeerBusiness; // the peer listing
};

export type SellerNetwork = {
  confirmed: NetworkConnection[];
  incoming: NetworkConnection[]; // someone says they worked with me — awaiting my confirm
  outgoing: NetworkConnection[]; // I said I worked with them — awaiting their confirm
  myServices: PeerBusiness[];
};

/** A seller's whole peer network, scoped to the listings they own. */
export async function getSellerNetwork(sellerId: string): Promise<SellerNetwork> {
  const supabase = createSupabaseServiceRoleClient();
  const { data: mine } = await supabase
    .from("services")
    .select("id, title, slug, logo_url")
    .eq("seller_id", sellerId)
    .neq("status", "removed");
  const myServices = (mine ?? []) as PeerBusiness[];
  const myIds = myServices.map((s) => s.id);
  if (myIds.length === 0) return { confirmed: [], incoming: [], outgoing: [], myServices };

  const idList = myIds.join(",");
  const { data: conns } = await supabase
    .from("peer_connections")
    .select("id, status, note, requester_service_id, peer_service_id")
    .or(`requester_service_id.in.(${idList}),peer_service_id.in.(${idList})`)
    .order("created_at", { ascending: false });
  const rows = (conns ?? []) as Array<{
    id: string; status: string; note: string | null; requester_service_id: string; peer_service_id: string;
  }>;

  const otherIds = Array.from(
    new Set(rows.map((c) => (myIds.includes(c.requester_service_id) ? c.peer_service_id : c.requester_service_id))),
  );
  const byId = new Map<string, PeerBusiness>(myServices.map((s) => [s.id, s]));
  if (otherIds.length > 0) {
    const { data: others } = await supabase.from("services").select("id, title, slug, logo_url").in("id", otherIds);
    for (const s of (others ?? []) as PeerBusiness[]) byId.set(s.id, s);
  }

  const confirmed: NetworkConnection[] = [];
  const incoming: NetworkConnection[] = [];
  const outgoing: NetworkConnection[] = [];
  for (const c of rows) {
    const iAmRequester = myIds.includes(c.requester_service_id);
    const myId = iAmRequester ? c.requester_service_id : c.peer_service_id;
    const otherId = iAmRequester ? c.peer_service_id : c.requester_service_id;
    const mineB = byId.get(myId);
    const other = byId.get(otherId);
    if (!mineB || !other) continue;
    const conn: NetworkConnection = { id: c.id, status: c.status, note: c.note, mine: mineB, other };
    if (c.status === "confirmed") confirmed.push(conn);
    else if (c.status === "pending") (iAmRequester ? outgoing : incoming).push(conn);
  }
  return { confirmed, incoming, outgoing, myServices };
}

/** Published listings a seller could link to (for the add-collaboration picker). */
export async function getLinkableBusinesses(sellerId: string): Promise<PeerBusiness[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("services")
    .select("id, title, slug, logo_url, seller_id")
    .eq("status", "published")
    .order("title", { ascending: true });
  return ((data ?? []) as Array<PeerBusiness & { seller_id: string | null }>)
    .filter((s) => s.seller_id !== sellerId)
    .map(({ id, title, slug, logo_url }) => ({ id, title, slug, logo_url }));
}

/** Admin-only: businesses that have flagged their peer-confidence for review. */
export async function getDisputedPeerConfidence() {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("services")
    .select("id, title, slug, peer_confidence_hidden, peer_confidence_disputed_at")
    .not("peer_confidence_disputed_at", "is", null)
    .order("peer_confidence_disputed_at", { ascending: false });
  return (data ?? []) as Array<{
    id: string;
    title: string;
    slug: string;
    peer_confidence_hidden: boolean;
    peer_confidence_disputed_at: string;
  }>;
}

/** Admin-only: all peer feedback with rater/subject titles, for the private view. */
export async function getPeerFeedbackForAdmin() {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("peer_feedback")
    .select("id, would_work_again, reliability, communication, quality, private_note, created_at, rater_service_id, subject_service_id")
    .order("created_at", { ascending: false })
    .limit(300);
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const ids = Array.from(new Set(rows.flatMap((r) => [r.rater_service_id as string, r.subject_service_id as string])));
  const titles = new Map<string, string>();
  if (ids.length > 0) {
    const { data: svcs } = await supabase.from("services").select("id, title").in("id", ids);
    for (const s of (svcs ?? []) as Array<{ id: string; title: string }>) titles.set(s.id, s.title);
  }
  return rows.map((r) => ({
    id: r.id as string,
    wouldWorkAgain: r.would_work_again as string,
    reliability: r.reliability as number | null,
    communication: r.communication as number | null,
    quality: r.quality as number | null,
    privateNote: (r.private_note as string | null) ?? null,
    createdAt: r.created_at as string,
    rater: titles.get(r.rater_service_id as string) ?? "—",
    subject: titles.get(r.subject_service_id as string) ?? "—",
  }));
}
