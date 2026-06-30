import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Inbox, Sparkles, UserRound } from "lucide-react";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { requireUser } from "@/lib/auth";
import styles from "./DashboardPage.module.css";

export const metadata: Metadata = {
  title: "Seller dashboard | Plistic",
};

// Per-user, auth-gated page — never statically prerender.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await requireUser("/dashboard");

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.inner}`}>
          <header className={styles.head}>
            <div>
              <p className={styles.kicker}>Seller dashboard</p>
              <h1>Welcome{profile.displayName ? `, ${profile.displayName}` : ""}.</h1>
              <p className={styles.lead}>Signed in as {profile.email}.</p>
            </div>
            <form action="/auth/signout" method="post">
              <button type="submit" className="p-btn p-btn--ghost">
                Sign out
              </button>
            </form>
          </header>

          <div className={styles.grid}>
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
            <DashboardCard
              icon={<Sparkles aria-hidden="true" size={20} />}
              title="Feature a listing"
              body="Boost a listing to the top of the directory with a monthly subscription."
              soon
            />
            <DashboardCard
              icon={<UserRound aria-hidden="true" size={20} />}
              title="Profile"
              body="Your public seller profile, bio, and avatar."
              href="/dashboard/profile"
            />
          </div>

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
