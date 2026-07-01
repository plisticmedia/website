"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "@/lib/services";

// Leaflet needs the browser, so load the map client-side only.
const ClusterMap = dynamic(() => import("./ClusterMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "440px",
        borderRadius: "16px",
        background: "#e7eef0",
        display: "grid",
        placeItems: "center",
        color: "#5d6b71",
      }}
    >
      Loading map…
    </div>
  ),
});

export function MapSection({ points, height }: { points: MapPoint[]; height?: number }) {
  if (points.length === 0) return null;
  return <ClusterMap points={points} height={height} />;
}
