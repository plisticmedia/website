import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { LaunchBanner } from "@/components/LaunchBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { ClosingCTA } from "@/sections/ClosingCTA";
import { PricingPath } from "@/sections/PricingPath";

export const metadata: Metadata = {
  title: "Pricing | Plistic",
  description: "A live estimator for all Plistic services.",
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
