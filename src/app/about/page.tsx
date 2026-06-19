import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { LaunchBanner } from "@/components/LaunchBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { AboutScotland } from "@/sections/AboutScotland";
import { ClosingCTA } from "@/sections/ClosingCTA";

export const metadata: Metadata = {
  title: "About | Plistic",
  description:
    "Meet Plistic, the Glasgow-based media production company shaped by psychology-informed podcast, video, and documentary work.",
};

export default function AboutPage() {
  return (
    <>
      <LaunchBanner />
      <SiteHeader />
      <main>
        <AboutScotland />
        <ClosingCTA />
      </main>
      <Footer />
    </>
  );
}
