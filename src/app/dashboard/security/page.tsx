import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { requireUser, getMfaStatus } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TwoFactorSetup } from "./TwoFactorSetup";
import styles from "../DashboardPage.module.css";

export const metadata: Metadata = { title: "Security | Plistic", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ admin?: string }>;
}) {
  const profile = await requireUser("/dashboard/security");
  const { admin } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const mfa = await getMfaStatus(supabase);
  const isAdmin = profile.role === "admin";
  const mustSetUp = admin === "1" && isAdmin && !mfa.hasFactor;

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.inner}`}>
          <header className={styles.head}>
            <div>
              <p className={styles.kicker}>
                <Link href="/dashboard">Dashboard</Link> / Security
              </p>
              <h1>Two-factor authentication</h1>
              <p className={styles.lead}>
                Add a second step to sign-in: a six-digit code from an authenticator app on your phone
                (Google Authenticator, Authy, 1Password and similar). Even if someone learns your password,
                they can&apos;t get in without your phone.
              </p>
            </div>
          </header>

          {mustSetUp && (
            <p className={styles.adminNote} role="alert" style={{ borderColor: "var(--p-azure)" }}>
              Admin accounts require two-factor authentication. Set it up below to reach the admin dashboard.
            </p>
          )}

          <article className={styles.card} style={{ maxWidth: 560 }}>
            <TwoFactorSetup hasFactor={mfa.hasFactor} isAdmin={isAdmin} />
          </article>

          {isAdmin && (
            <p className={styles.adminNote} style={{ marginTop: "1.4rem" }}>
              Tip: keep a backup. If you ever lose access to your authenticator app, you&apos;ll need it
              removed from your account before you can sign in to admin again — so store the setup key
              somewhere safe, or enrol a second device.
            </p>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
