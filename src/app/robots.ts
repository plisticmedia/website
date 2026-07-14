import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.plisticmedia.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep private / functional areas out of search results.
        disallow: ["/admin", "/dashboard", "/api/", "/claim/", "/reset-password", "/login", "/experiments"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
