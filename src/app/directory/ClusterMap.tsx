"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import type { MapPoint } from "@/lib/services";

// Rough centre of mainland Scotland.
const SCOTLAND_CENTER: [number, number] = [56.8, -4.2];

function esc(value: string) {
  return value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

/** A small round pin — gold for trusted partners, blue otherwise. */
function pinIcon(featured: boolean) {
  const fill = featured ? "#f5c84b" : "#1faae9";
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${fill};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconSize: L.point(16, 16),
    iconAnchor: L.point(8, 8),
    popupAnchor: L.point(0, -9),
  });
}

/** A brand-blue circle showing how many businesses are grouped here. */
function clusterIcon(count: number) {
  const size = count < 10 ? 38 : count < 50 ? 46 : 54;
  return L.divIcon({
    className: "",
    html:
      `<div style="width:${size}px;height:${size}px;border-radius:50%;background:rgba(31,170,233,.92);` +
      `border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;` +
      `justify-content:center;color:#fff;font-weight:700;font-size:14px;line-height:1">${count}</div>`,
    iconSize: L.point(size, size),
  });
}

function popupHtml(p: MapPoint) {
  const meta = [p.category, p.location].filter(Boolean).join(" · ");
  return (
    `<div style="min-width:160px">` +
    `<strong>${esc(p.title)}</strong>` +
    (p.address ? `<div style="color:#5d6b71;font-size:12px;margin-top:2px">${esc(p.address)}</div>` : "") +
    (meta ? `<div style="font-size:12px;margin-top:2px">${esc(meta)}</div>` : "") +
    `<a href="/directory/${encodeURIComponent(p.slug)}" style="display:inline-block;margin-top:6px;color:#0c6f9e;font-weight:600">View listing →</a>` +
    `</div>`
  );
}

/** Adds a marker-cluster layer to the map. Clusters show a count; zooming in
 *  splits them into individual pins that show each business's address. */
function Clusters({ points }: { points: MapPoint[] }) {
  const map = useMap();

  useEffect(() => {
    const group = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 55,
      iconCreateFunction: (cluster) => clusterIcon(cluster.getChildCount()),
    });

    for (const p of points) {
      const marker = L.marker([p.latitude, p.longitude], { icon: pinIcon(p.is_featured) });
      marker.bindPopup(popupHtml(p));
      group.addLayer(marker);
    }

    map.addLayer(group);
    return () => {
      map.removeLayer(group);
    };
  }, [map, points]);

  return null;
}

export default function ClusterMap({ points, height = 440 }: { points: MapPoint[]; height?: number }) {
  return (
    <MapContainer
      center={SCOTLAND_CENTER}
      zoom={6}
      scrollWheelZoom={false}
      style={{ height: `${height}px`, width: "100%", borderRadius: "16px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
      />
      <Clusters points={points} />
    </MapContainer>
  );
}
