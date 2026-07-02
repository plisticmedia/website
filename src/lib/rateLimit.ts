// Lightweight in-memory rate limiter for public POST routes. It's per-instance
// (serverless may run several), so it's a spam speed-bump rather than a hard
// global cap — combined with the honeypots it stops casual floods with zero
// infra. Swap for Upstash/Redis later if a strict global limit is needed.

type Timestamps = number[];
const store = new Map<string, Timestamps>();

/** Returns true if the action is allowed, false if the key is over the limit. */
export function rateLimit(key: string, limit = 5, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const recent = (store.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    store.set(key, recent);
    return false;
  }
  recent.push(now);
  store.set(key, recent);
  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (store.size > 5000) {
    for (const [k, v] of store) if (v.every((t) => now - t >= windowMs)) store.delete(k);
  }
  return true;
}

/** Best-effort client IP from proxy headers. */
export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  const first = xff?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip") || "unknown";
}
