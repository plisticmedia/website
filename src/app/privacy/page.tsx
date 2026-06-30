import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { brand } from "@/data/site";
import styles from "../legal/Legal.module.css";

export const metadata: Metadata = {
  title: "Privacy | Plistic",
  description: "How Plistic collects and uses your personal data.",
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.inner}`}>
          <p className={styles.kicker}>Legal</p>
          <h1>Privacy notice</h1>
          <p className={styles.updated}>Last updated 30 June 2026</p>

          <p>
            This notice explains how Plistic (&ldquo;we&rdquo;) collects and uses personal data when you use our
            website, forms, and partner directory. We are the data controller for the personal data described here.
          </p>

          <h2>What we collect</h2>
          <ul>
            <li><strong>Form submissions</strong> — name, email, and message when you use our contact, quote, referral, or partnership forms.</li>
            <li><strong>Directory enquiries</strong> — your name, email, and message, which we share with the relevant Seller so they can reply.</li>
            <li><strong>Seller accounts</strong> — your email (for sign-in) and the profile and listing details you choose to publish.</li>
            <li><strong>Technical data</strong> — basic, standard server and security information needed to run the site.</li>
          </ul>

          <h2>How we use it</h2>
          <ul>
            <li>To respond to your enquiries and connect buyers with Sellers.</li>
            <li>To operate Seller accounts, listings, and the Directory.</li>
            <li>To send transactional emails (confirmations, enquiry notifications, sign-in links).</li>
            <li>To keep the service secure and prevent abuse.</li>
          </ul>
          <p>
            Our lawful bases are your consent (where you submit a form), our legitimate interests in operating the
            Directory, and performance of a contract where you hold an account.
          </p>

          <h2>Who processes your data</h2>
          <p>We use trusted providers to run the service:</p>
          <ul>
            <li><strong>Supabase</strong> — database, authentication, and file storage.</li>
            <li><strong>Resend</strong> — sending transactional email.</li>
            <li><strong>Vercel</strong> — website hosting.</li>
            <li><strong>Cal.com</strong> — call scheduling, where you choose to book.</li>
          </ul>

          <h2>Sharing</h2>
          <p>
            When you submit a Directory enquiry, the details are shared with the Seller you contacted. We do not
            sell your personal data. We may disclose data where required by law.
          </p>

          <h2>Retention</h2>
          <p>
            We keep personal data only as long as needed for the purposes above or as required by law, then delete
            or anonymise it.
          </p>

          <h2>Your rights</h2>
          <p>
            Under UK data protection law you can request access to, correction of, or deletion of your personal
            data, and object to certain processing. To exercise these rights, email{" "}
            <a href={`mailto:${brand.email}`}>{brand.email}</a>. You can also complain to the UK Information
            Commissioner&rsquo;s Office (ICO).
          </p>

          <h2>Contact</h2>
          <p>
            For any privacy question, email <a href={`mailto:${brand.email}`}>{brand.email}</a>.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
