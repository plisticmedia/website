"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "@/lib/services";

// Leaflet needs the browser, so load the map client-side only.
const DirectoryMap = dynamic(() => import("./DirectoryMap"), {
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

export function MapSection({ points }: { points: MapPoint[] }) {
  if (points.length === 0) return null;
  return <DirectoryMap points={points} />;
}
