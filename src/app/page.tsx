import { Footer } from "@/components/Footer";
import { LaunchBanner } from "@/components/LaunchBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { ClosingCTA } from "@/sections/ClosingCTA";
import { Hero } from "@/sections/Hero";
import { ProofTrust } from "@/sections/ProofTrust";
import { ServicesOverview } from "@/sections/ServicesOverview";
import { WorkPreview } from "@/sections/WorkPreview";

export default function Home() {
  return (
    <>
      <LaunchBanner />
      <SiteHeader />
      <main>
        <Hero />
        <ProofTrust />
        <ServicesOverview />
        <WorkPreview />
        <ClosingCTA />
      </main>
      <Footer />
    </>
  );
}
