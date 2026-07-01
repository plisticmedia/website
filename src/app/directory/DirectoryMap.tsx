"use client";

import Link from "next/link";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { MapPoint } from "@/lib/services";

// Rough centre of Scotland.
const SCOTLAND_CENTER: [number, number] = [56.8, -4.2];

export default function DirectoryMap({ points }: { points: MapPoint[] }) {
  return (
    <MapContainer
      center={SCOTLAND_CENTER}
      zoom={6}
      scrollWheelZoom={false}
      style={{ height: "440px", width: "100%", borderRadius: "16px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.latitude, p.longitude]}
          radius={p.is_featured ? 9 : 7}
          pathOptions={{
            color: "#ffffff",
            weight: 2,
            fillColor: p.is_featured ? "#f5c84b" : "#1faae9",
            fillOpacity: 0.9,
          }}
        >
          <Popup>
            <strong>{p.title}</strong>
            <br />
            {[p.category, p.location].filter(Boolean).join(" · ")}
            <br />
            <Link href={`/directory/${p.slug}`}>View listing →</Link>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
