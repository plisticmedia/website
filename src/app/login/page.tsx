import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { getSessionProfile } from "@/lib/auth";
import { LoginForm } from "./LoginForm";
import styles from "./LoginPage.module.css";

export const metadata: Metadata = {
  title: "Sign in | Plistic",
  description: "Sign in or create a Plistic seller account to list your media services.",
};

// Reads the auth session from cookies — never statically prerender.
export const dynamic = "force-dynamic";

function safeNext(value: string | undefined) {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/dashboard";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);

  // Already signed in — skip the form.
  const profile = await getSessionProfile();
  if (profile) {
    redirect(next);
  }

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.inner}`}>
          <div className={styles.copy}>
            <p className={styles.kicker}>Seller access</p>
            <h1>
              List your work on <span>Plistic</span>.
            </h1>
            <p className={styles.lead}>
              Create your free account or sign in to manage listings, respond to enquiries, and feature your
              services. Use an email and password, continue with Google, or get a one-time email link.
            </p>
          </div>
          <div className={styles.formColumn}>
            {params.error && (
              <p className={`${styles.status} ${styles.error}`} role="alert">
                That sign-in link didn&apos;t work or has expired. Please try again.
              </p>
            )}
            <LoginForm next={next} />
            <p className={styles.fineprint}>
              By continuing you agree to Plistic&apos;s seller terms. The directory makes introductions only —
              Plistic is not a party to any sale arranged between sellers and buyers.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
