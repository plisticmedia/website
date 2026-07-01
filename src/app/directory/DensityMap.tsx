"use client";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { DensityPoint } from "@/lib/services";

const SCOTLAND_CENTER: [number, number] = [56.8, -4.2];

export default function DensityMap({ points }: { points: DensityPoint[] }) {
  const max = points.reduce((m, p) => Math.max(m, p.count), 1);

  return (
    <MapContainer
      center={SCOTLAND_CENTER}
      zoom={6}
      scrollWheelZoom={false}
      style={{ height: "520px", width: "100%", borderRadius: "16px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((p) => {
        // Scale radius by share of the max (12–48px).
        const radius = 12 + Math.round((p.count / max) * 36);
        return (
          <CircleMarker
            key={p.slug}
            center={[p.lat, p.lng]}
            radius={radius}
            pathOptions={{ color: "#0c6f9e", weight: 1.5, fillColor: "#1faae9", fillOpacity: 0.45 }}
          >
            <Popup>
              <strong>{p.name}</strong>
              <br />
              {p.count} {p.count === 1 ? "company" : "companies"} working here
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
