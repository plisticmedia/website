import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Plistic",
    short_name: "Plistic",
    description: "Scotland's creative & media directory.",
    start_url: "/",
    display: "standalone",
    background_color: "#141417",
    theme_color: "#141417",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
