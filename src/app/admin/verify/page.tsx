import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { requireAdminRole, getMfaStatus } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StepUpForm } from "./StepUpForm";
import styles from "../Admin.module.css";

export const metadata: Metadata = { title: "Verify it's you | Plistic", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Second-factor step-up before entering /admin. Tolerates AAL1 (that's the point). */
export default async function AdminVerifyPage() {
  await requireAdminRole();
  const supabase = await createSupabaseServerClient();
  const mfa = await getMfaStatus(supabase);

  // Nothing to step up to — send them to enrol; already stepped up — into admin.
  if (!mfa.hasFactor) redirect("/dashboard/security?admin=1");
  if (mfa.aal2) redirect("/admin");

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container`} style={{ maxWidth: 460, paddingBlock: "clamp(2rem, 6vw, 4rem)" }}>
          <h1 style={{ fontFamily: "var(--p-display)", fontSize: "1.8rem", marginBottom: "0.4rem" }}>
            Verify it&apos;s you
          </h1>
          <p style={{ color: "var(--p-muted)", marginBottom: "1.4rem" }}>
            Enter the 6-digit code from your authenticator app to open the admin dashboard.
          </p>
          <StepUpForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
