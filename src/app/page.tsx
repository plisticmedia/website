import { Footer } from "@/components/Footer";
import { LaunchBanner } from "@/components/LaunchBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { ClosingCTA } from "@/sections/ClosingCTA";
import { Hero } from "@/sections/Hero";
import { PlatformSignpost } from "@/sections/PlatformSignpost";
import { ProofTrust } from "@/sections/ProofTrust";
import { ServicesOverview } from "@/sections/ServicesOverview";
import { Showreel } from "@/sections/Showreel";
import { Testimonials } from "@/sections/Testimonials";
import { WorkPreview } from "@/sections/WorkPreview";

export default function Home() {
  return (
    <>
      <LaunchBanner />
      <SiteHeader />
      <main>
        <Hero />
        <ProofTrust />
        <Showreel />
        <ServicesOverview />
        <WorkPreview />
        <PlatformSignpost />
        <Testimonials />
        <ClosingCTA />
      </main>
      <Footer />
    </>
  );
}
