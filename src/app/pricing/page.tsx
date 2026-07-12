import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { LaunchBanner } from "@/components/LaunchBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { ClosingCTA } from "@/sections/ClosingCTA";
import { PricingPath } from "@/sections/PricingPath";
import type { ServiceChoice } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Pricing | Plistic",
  description: "A live estimator for all Plistic services.",
};

// Lets service pages deep-link to the matching tab, e.g. /pricing?service=event
const SERVICE_PARAMS: Record<string, ServiceChoice> = {
  podcast: "podcast",
  event: "event",
  musicVideo: "musicVideo",
  documentary: "documentary",
  coaching: "coaching",
  other: "other",
};

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service } = await searchParams;
  const initialService = service ? SERVICE_PARAMS[service] : undefined;

  return (
    <>
      <LaunchBanner />
      <SiteHeader />
      <main>
        <PricingPath initialService={initialService} />
        <ClosingCTA />
      </main>
      <Footer />
    </>
  );
}
