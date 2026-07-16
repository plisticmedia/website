import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { FeedbackButton } from "@/components/FeedbackButton";

export const metadata: Metadata = {
  title: "Plistic | Media made simPLISTIC",
  description: "Plistic is a Glasgow-based media production company for podcasts, video, documentary, ads, and strategy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="dns-prefetch" href="https://calendly.com" />
        <link rel="dns-prefetch" href="https://assets.calendly.com" />
        <link rel="preconnect" href="https://calendly.com" />
        <link rel="preconnect" href="https://assets.calendly.com" crossOrigin="" />
      </head>
      <body>
        {children}
        {process.env.SITE_LIVE !== "true" && <FeedbackButton />}
        <Analytics />
      </body>
    </html>
  );
}
