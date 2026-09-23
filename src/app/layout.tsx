import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { FeedbackButton } from "@/components/FeedbackButton";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.plisticmedia.com";
const SITE_TITLE = "Plistic | Media made simPLISTIC";
const SITE_DESCRIPTION =
  "Plistic is a Glasgow-based media production company for podcasts, video, documentary, ads, and strategy.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: "Plistic Media",
  keywords: [
    "Plistic",
    "Plistic Media",
    "Glasgow media production",
    "podcast production Scotland",
    "video production Glasgow",
    "documentary",
    "Scotland creative directory",
  ],
  alternates: { canonical: "/" },
  verification: {
    google: "XfOIUHwrWvtqZpnnzkWAgOkjDzyAO8_zaUmhWACHgh8",
  },
  openGraph: {
    type: "website",
    siteName: "Plistic Media",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

// Organisation structured data — tells Google that "Plistic Media" is a real
// organisation (helping it treat the name as a genuine word rather than a typo
// of "plastic"), and links the former "PodPlistic" brand to it via alternateName.
const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Plistic Media",
  legalName: "Songplistic Ltd",
  alternateName: ["Plistic", "PodPlistic", "Pod Plistic"],
  url: SITE_URL,
  logo: `${SITE_URL}/assets/brand/plistic-media.png`,
  description: SITE_DESCRIPTION,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Glasgow",
    addressCountry: "GB",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="dns-prefetch" href="https://cal.com" />
        <link rel="dns-prefetch" href="https://app.cal.com" />
        <link rel="preconnect" href="https://cal.com" />
        <link rel="preconnect" href="https://app.cal.com" crossOrigin="" />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSONLD) }}
        />
        {children}
        {process.env.SITE_LIVE !== "true" && <FeedbackButton />}
        <Analytics />
      </body>
    </html>
  );
}
