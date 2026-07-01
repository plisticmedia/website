import { Star } from "lucide-react";

/**
 * Displays a business's Google rating (stars + score + review count) with the
 * required attribution. Renders nothing when there's no rating yet.
 */
export function GoogleRating({
  rating,
  count,
  size = 14,
  className,
}: {
  rating: number | null;
  count: number | null;
  size?: number;
  className?: string;
}) {
  if (rating == null) return null;

  const rounded = Math.round(rating);
  const label = `Rated ${rating.toFixed(1)} out of 5 on Google${count ? ` from ${count} reviews` : ""}`;

  return (
    <span
      className={className}
      aria-label={label}
      style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: `${size}px`, lineHeight: 1 }}
    >
      <span aria-hidden="true" style={{ display: "inline-flex", color: "#f5a623" }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={size} fill={i < rounded ? "currentColor" : "none"} strokeWidth={1.5} />
        ))}
      </span>
      <strong style={{ fontSize: `${size}px` }}>{rating.toFixed(1)}</strong>
      {count != null && <span style={{ color: "var(--p-muted)" }}>({count})</span>}
      <span style={{ color: "var(--p-muted)", fontSize: `${size - 2}px` }}>· Google</span>
    </span>
  );
}
