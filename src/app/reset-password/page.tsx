import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { ResetPasswordForm } from "./ResetPasswordForm";
import styles from "../login/LoginPage.module.css";

export const metadata: Metadata = {
  title: "Set a new password | Plistic",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.inner}`}>
          <div className={styles.copy}>
            <p className={styles.kicker}>Account</p>
            <h1>
              Set a new <span>password</span>.
            </h1>
            <p className={styles.lead}>Choose a new password for your Plistic account. You&apos;ll be signed in straight after.</p>
          </div>
          <div className={styles.formColumn}>
            <ResetPasswordForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
