import { Footer } from "@/components/Footer";
import { LaunchBanner } from "@/components/LaunchBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { getSessionProfile } from "@/lib/auth";
import { ClosingCTA } from "@/sections/ClosingCTA";
import { Hero } from "@/sections/Hero";
import { PlatformSignpost } from "@/sections/PlatformSignpost";
import { ProofTrust } from "@/sections/ProofTrust";
import { ServicesOverview } from "@/sections/ServicesOverview";
import { EnquirySignpost } from "@/sections/EnquirySignpost";
import { ShowcaseHighlights } from "@/sections/ShowcaseHighlights";
import { Showreel } from "@/sections/Showreel";
import { Testimonials } from "@/sections/Testimonials";
import { WorkPreview } from "@/sections/WorkPreview";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Admins and beta testers see the full original homepage (directory + showcase);
  // everyone else sees the streamlined public version (studio + shop).
  const viewer = await getSessionProfile();
  const privileged = viewer?.betaAccess === true;

  return (
    <>
      <LaunchBanner />
      <SiteHeader />
      <main>
        <Hero />
        {privileged ? <PlatformSignpost /> : <EnquirySignpost />}
        <ProofTrust />
        <Showreel />
        <ServicesOverview />
        <WorkPreview />
        {privileged && <ShowcaseHighlights />}
        <Testimonials />
        <ClosingCTA />
      </main>
      <Footer />
    </>
  );
}
