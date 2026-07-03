import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { syncConnectStatus } from "@/lib/connect";
import { PayoutsButton } from "./PayoutsButton";
import styles from "../DashboardPage.module.css";

export const metadata: Metadata = { title: "Payouts | Plistic" };
export const dynamic = "force-dynamic";

export default async function PayoutsPage() {
  const profile = await requireUser("/dashboard/payouts");
  const supabase = await createSupabaseServerClient();
  const { data: prof } = await supabase
    .from("profiles")
    .select("stripe_connect_account_id, payouts_enabled, charges_enabled")
    .eq("id", profile.id)
    .maybeSingle();

  const accountId = prof?.stripe_connect_account_id as string | null;

  // Ask Stripe directly for the latest status (don't wait on the webhook).
  let ready = !!prof?.payouts_enabled;
  if (accountId && process.env.STRIPE_SECRET_KEY) {
    const fresh = await syncConnectStatus(accountId);
    if (fresh) ready = fresh.payouts_enabled;
  }

  const started = !!accountId;
  // Started onboarding but Stripe hasn't confirmed payouts yet.
  const pending = started && !ready;

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.inner}`}>
          <header className={styles.head}>
            <div>
              <p className={styles.kicker}>
                <Link href="/dashboard">Dashboard</Link> / Payouts
              </p>
              <h1>Get paid through Plistic</h1>
              <p className={styles.lead}>
                To sell bookable services on the marketplace, connect a payout account. We use Stripe to
                verify your identity and pay you securely — Plistic never sees your bank details.
              </p>
            </div>
          </header>

          <article className={styles.card} style={{ maxWidth: 640 }}>
            {ready ? (
              <>
                <h2>✅ Ready to receive payouts</h2>
                <p>
                  Your payout account is set up. When a buyer books one of your bookable packages, the money is
                  held securely and paid out to you once the work is confirmed delivered.
                </p>
                <PayoutsButton label="Update payout details" />
              </>
            ) : pending ? (
              <>
                <h2>⏳ Verification in progress</h2>
                <p>
                  Stripe is still verifying your details. This usually takes a few minutes, but can take longer if
                  more information is needed. You can reopen onboarding to finish any remaining steps, or{" "}
                  <Link href="/dashboard/payouts">refresh this page</Link> to check again.
                </p>
                <PayoutsButton label="Continue setup" />
              </>
            ) : (
              <>
                <h2>Connect a payout account</h2>
                <p>
                  Set this up once to turn on paid bookings. It takes a couple of minutes — you&apos;ll need your
                  business or personal details and a bank account for payouts.
                </p>
                <PayoutsButton label="Set up payouts" />
              </>
            )}
          </article>

          <p className={styles.adminNote} style={{ marginTop: "1.4rem" }}>
            Plistic takes a small commission on marketplace sales (10%, or 5% for featured members) to run the
            platform. Free directory enquiries are unaffected — this only applies to bookable packages you choose
            to sell online.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
