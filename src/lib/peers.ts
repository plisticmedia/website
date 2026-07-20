import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export type PeerBusiness = { id: string; title: string; slug: string; logo_url: string | null };

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
