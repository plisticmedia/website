import { ImageResponse } from "next/og";

// Home-screen icon (iOS applies its own rounded-corner mask, so this is a
// full-bleed square). Rendered to PNG at build via next/og — no rasterizer
// needed. Reuses the same vector [P] mark as the browser-tab favicon.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const MARK_SVG = `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" fill="#141417"/>
  <g stroke="#1faae9" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <path d="M26 15 H17 V24"/>
    <path d="M38 15 H47 V24"/>
    <path d="M17 40 V49 H26"/>
    <path d="M47 40 V49 H38"/>
  </g>
  <rect x="27" y="20" width="6" height="24" rx="1" fill="#ffffff"/>
  <circle cx="34" cy="28" r="8" fill="#ffffff"/>
  <circle cx="36.5" cy="27.5" r="3.3" fill="#141417"/>
</svg>`;

export default function AppleIcon() {
  const src = `data:image/svg+xml;base64,${Buffer.from(MARK_SVG).toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img width={180} height={180} src={src} alt="" />
      </div>
    ),
    { ...size },
  );
}
