"use client";

import dynamic from "next/dynamic";
import type { DensityPoint } from "@/lib/services";

const DensityMap = dynamic(() => import("./DensityMap"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "520px", borderRadius: "16px", background: "#e7eef0", display: "grid", placeItems: "center", color: "#5d6b71" }}>
      Loading map…
    </div>
  ),
});

export function DensityMapSection({ points }: { points: DensityPoint[] }) {
  if (points.length === 0) {
    return (
      <p style={{ color: "var(--p-muted)", padding: "2rem 0" }}>
        No coverage data to map yet — add the areas businesses work in (via the listing editor or import).
      </p>
    );
  }
  return <DensityMap points={points} />;
}
