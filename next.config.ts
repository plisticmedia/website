import type { NextConfig } from "next";

// Baseline security headers applied to every response. (A full Content-Security-
// Policy is intentionally left out for now — it needs to allow-list Stripe,
// Supabase, map tiles etc. and a wrong one silently breaks the site; add it as a
// deliberate, tested follow-up.)
const securityHeaders = [
  // Force HTTPS for two years, including subdomains.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Stop other sites from framing us (clickjacking).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Don't let browsers MIME-sniff responses.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't leak full URLs to other origins.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Turn off device APIs the site doesn't use.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // Photo uploads run through Server Actions, whose body limit defaults to
    // 1 MB — smaller than most phone photos, which caused the upload to error.
    // Photos are resized in-browser first, but a batch of several still needs
    // headroom (and logos upload uncompressed up to 15 MB).
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
