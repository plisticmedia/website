import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Inbox, UserRound, Wallet, ShoppingBag, Receipt, ShieldCheck, Search, Store, Users } from "lucide-react";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { becomeBusiness } from "./listings/actions";
import { FeatureCard } from "./FeatureCard";
import { DashboardTour } from "./DashboardTour";
import styles from "./DashboardPage.module.css";

export const metadata: Metadata = {
  title: "Seller dashboard | Plistic",
  robots: { index: false, follow: false },
};

// Per-user, auth-gated page — never statically prerender.
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ featured?: string; tour?: string }>;
}) {
  const profile = await requireUser("/dashboard");
  const { featured, tour } = await searchParams;

  const isBusiness = profile.accountType === "business" || profile.role === "admin";

  const supabase = await createSupabaseServerClient();
  const { data: sub } = isBusiness
    ? await supabase
        .from("sponsorships")
        .select("status")
        .eq("seller_id", profile.id)
        .eq("status", "active")
        .maybeSingle()
    : { data: null };
  const featuredActive = !!sub;

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.inner}`}>
          <header className={styles.head}>
            <div>
              <p className={styles.kicker}>{isBusiness ? "Business dashboard" : "Your account"}</p>
              <h1>Welcome{profile.displayName ? `, ${profile.displayName}` : ""}.</h1>
              <p className={styles.lead}>
                {isBusiness
                  ? `Signed in as ${profile.email}.`
                  : `Signed in as ${profile.email}. Browse and book services from Scotland's creative scene.`}
              </p>
            </div>
            <div className={styles.headActions}>
              <Link href="/dashboard?tour=1" className={styles.tourLink}>Show me around</Link>
              <form action="/auth/signout" method="post">
                <button type="submit" className="p-btn p-btn--ghost">
                  Sign out
                </button>
              </form>
            </div>
          </header>

          <DashboardTour isBusiness={isBusiness} replay={tour === "1"} />

          {featured === "success" && (
            <p className={styles.adminNote} role="status">
              Thanks — your subscription is active. Your listings are being featured (this can take a few seconds).
            </p>
          )}

          <div className={styles.grid}>
            {isBusiness && (
              <>
                <DashboardCard
                  icon={<ClipboardList aria-hidden="true" size={20} />}
                  title="My listings"
                  body="Create and manage the services you offer in the directory."
                  href="/dashboard/listings"
                />
                <DashboardCard
                  icon={<Inbox aria-hidden="true" size={20} />}
                  title="Enquiries"
                  body="Buyer enquiries about your listings will arrive here and by email."
                  href="/dashboard/enquiries"
                />
                <FeatureCard active={featuredActive} />
                <DashboardCard
                  icon={<Receipt aria-hidden="true" size={20} />}
                  title="Sales"
                  body="Bookings buyers have made. Mark work delivered to release your payout."
                  href="/dashboard/sales"
                />
                <DashboardCard
                  icon={<Users aria-hidden="true" size={20} />}
                  title="My network"
                  body="Map who you've worked with. Confirmed collaborations show on your profile."
                  href="/dashboard/network"
                />
              </>
            )}
            <DashboardCard
              icon={<ShoppingBag aria-hidden="true" size={20} />}
              title="My orders"
              body="Services you've booked, and their status."
              href="/dashboard/orders"
            />
            {isBusiness && (
              <DashboardCard
                icon={<Wallet aria-hidden="true" size={20} />}
                title="Payouts"
                body="Connect a payout account to sell bookable services and get paid securely."
                href="/dashboard/payouts"
              />
            )}
            <DashboardCard
              icon={<UserRound aria-hidden="true" size={20} />}
              title="Profile"
              body={isBusiness ? "Your public seller profile, bio, and avatar." : "Your name and account details."}
              href="/dashboard/profile"
            />
            <DashboardCard
              icon={<ShieldCheck aria-hidden="true" size={20} />}
              title="Security"
              body="Turn on two-factor authentication to protect your account."
              href="/dashboard/security"
            />
            {!isBusiness && (
              <DashboardCard
                icon={<Search aria-hidden="true" size={20} />}
                title="Browse the directory"
                body="Find and book photographers, film-makers, studios and more."
                href="/directory"
              />
            )}
          </div>

          {!isBusiness && (
            <div className={styles.upgrade}>
              <div>
                <span className={styles.upgradeIcon} aria-hidden="true"><Store size={20} /></span>
                <div>
                  <h2>Are you a business?</h2>
                  <p>List your services on Plistic to get found and hired. It&apos;s free to start.</p>
                </div>
              </div>
              <form action={becomeBusiness}>
                <button type="submit" className="p-btn">List my business</button>
              </form>
            </div>
          )}

          {profile.role === "admin" && (
            <p className={styles.adminNote}>
              You have admin access. <Link href="/admin">Open the admin dashboard →</Link>
            </p>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

function DashboardCard({
  icon,
  title,
  body,
  soon,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  soon?: boolean;
  href?: string;
}) {
  const inner = (
    <>
      <span className={styles.cardIcon}>{icon}</span>
      <h2>{title}</h2>
      <p>{body}</p>
      {soon && <span className={styles.badge}>Coming soon</span>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${styles.card} ${styles.cardLink}`}>
        {inner}
      </Link>
    );
  }

  return <article className={styles.card}>{inner}</article>;
}
