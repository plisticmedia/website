import { Footer } from "@/components/Footer";
import { LaunchBanner } from "@/components/LaunchBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { ClosingCTA } from "@/sections/ClosingCTA";
import { Hero } from "@/sections/Hero";
import { PlatformSignpost } from "@/sections/PlatformSignpost";
import { ProofTrust } from "@/sections/ProofTrust";
import { ServicesOverview } from "@/sections/ServicesOverview";
import { ShowcaseHighlights } from "@/sections/ShowcaseHighlights";
import { Showreel } from "@/sections/Showreel";
import { Testimonials } from "@/sections/Testimonials";
import { WorkPreview } from "@/sections/WorkPreview";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <LaunchBanner />
      <SiteHeader />
      <main>
        <Hero />
        <PlatformSignpost />
        <ProofTrust />
        <Showreel />
        <ServicesOverview />
        <WorkPreview />
        <ShowcaseHighlights />
        <Testimonials />
        <ClosingCTA />
      </main>
      <Footer />
    </>
  );
}
