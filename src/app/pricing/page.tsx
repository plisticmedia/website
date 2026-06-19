import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { LaunchBanner } from "@/components/LaunchBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { ClosingCTA } from "@/sections/ClosingCTA";
import { PricingPath } from "@/sections/PricingPath";

export const metadata: Metadata = {
  title: "Pricing | Plistic",
  description:
    "Estimate podcast production, event filming, coaching, and documentary pricing with Plistic's live pricing calculator.",
};

export default function PricingPage() {
  return (
    <>
      <LaunchBanner />
      <SiteHeader />
      <main>
        <PricingPath />
        <ClosingCTA />
      </main>
      <Footer />
    </>
  );
}
