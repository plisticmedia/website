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
  searchParams: Promise<{ next?: string; error?: string; as?: string; signup?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const asType: "buyer" | "business" = params.as === "business" ? "business" : "buyer";
  const wantSignup = params.signup === "1";

  // Already signed in — skip the form.
  const profile = await getSessionProfile();
  if (profile) {
    redirect(next);
  }

  const isBusiness = asType === "business";

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.inner}`}>
          <div className={styles.copy}>
            <p className={styles.kicker}>{isBusiness ? "Business account" : "Your Plistic account"}</p>
            <h1>
              {isBusiness ? (
                <>
                  List your business on <span>Plistic</span>.
                </>
              ) : (
                <>
                  Buy and book on <span>Plistic</span>.
                </>
              )}
            </h1>
            <p className={styles.lead}>
              {isBusiness
                ? "Create your free business account or sign in to build your listing, respond to enquiries, and take bookings. Use an email and password, continue with Google, or get a one-time email link."
                : "Create a free account or sign in to buy, book, track your orders, and leave reviews. Use an email and password, continue with Google, or get a one-time email link."}
            </p>
          </div>
          <div className={styles.formColumn}>
            {params.error && (
              <p className={`${styles.status} ${styles.error}`} role="alert">
                That sign-in link didn&apos;t work or has expired. Please try again.
              </p>
            )}
            <LoginForm next={next} initialSignUp={wantSignup} initialAccountType={asType} />
            <p className={styles.fineprint}>
              By continuing you agree to Plistic&apos;s terms. The directory makes introductions only — Plistic is not
              a party to any sale arranged between buyers and sellers.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
