import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import styles from "../legal/Legal.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy | Plistic",
  description: "How Plistic (Songplistic Ltd) collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.inner}`}>
          <p className={styles.kicker}>Legal</p>
          <h1>Privacy Policy</h1>
          <p className={styles.updated}>
            A trading name of Songplistic Ltd, a company registered in Scotland · Last updated 30 June 2026
          </p>

          <h2>1. Who We Are</h2>
          <p>
            This Privacy Policy explains how Plistic, the trading name of Songplistic Ltd (&ldquo;we&rdquo;,
            &ldquo;us&rdquo;, &ldquo;our&rdquo;), a company registered in Scotland under company number SC699049 with
            its registered office at 2 West Drive Cottage, Stracathro, Brechin, Scotland, DD9 7QF, collects, uses, and
            protects your personal data when you visit our website or get in touch with us. We are the data controller
            for the personal data described in this policy. If you have any questions, you can contact us at{" "}
            <a href="mailto:hello@plisticmedia.com">hello@plisticmedia.com</a>.
          </p>

          <h2>2. What Information We Collect</h2>
          <p>We only collect personal data that you choose to give us, through the following channels:</p>
          <p>
            <strong>2.1 Contact and Enquiry Forms.</strong> If you fill in a contact form, brief form, or enquiry form,
            we collect whatever information you provide — typically your name, email address, and details about your
            project. Phone number is collected if you choose to provide it.
          </p>
          <p>
            <strong>2.2 Quote Calculator.</strong> If you use our quote estimator, we collect the selections you make
            (service type, scope, budget range, and similar) to generate an indicative price range. If you choose to
            proceed and leave your contact details, we collect those as in Section 2.1.
          </p>
          <p>
            <strong>2.3 Booking a Call.</strong> Our discovery calls are booked through Calendly, which collects your
            name, email address, and any information you provide in the booking form on our behalf, as a processor
            acting on our instructions (see Section 6).
          </p>
          <p>
            <strong>2.4 Referral and Partnership Forms.</strong> If you submit a referral or partnership enquiry, we
            collect your name and email address, along with the name and contact details of anyone you refer to us
            (with your confirmation that you are entitled to share this).
          </p>
          <p>
            <strong>2.5 Email and Other Direct Correspondence.</strong> If you email, call, or speak with us directly,
            we collect and retain that correspondence and any personal data in it, to respond and manage our
            relationship with you. This includes contacts we hold in our CRM — every person in our CRM is someone we
            have had a genuine prior conversation or working relationship with.
          </p>
          <p>
            <strong>2.6 Website Analytics.</strong> We use Google Analytics to understand how visitors use our website.
            This data is aggregated and does not identify you personally (see Section 6).
          </p>
          <p>
            <strong>2.7 Partner Directory.</strong> If you create a Seller account in our partner directory, we collect
            the email address you sign in with and the profile and listing details you choose to publish (including any
            images or media you upload). If you submit an enquiry on a Seller&rsquo;s listing, we collect your name,
            email, and message — and share these with the relevant Seller so they can reply to you directly (see
            Sections 6 and 11).
          </p>

          <h2>3. How We Use Your Information</h2>
          <ul>
            <li>To respond to your enquiry and provide you with a quote or information about our services.</li>
            <li>To manage bookings and discovery calls.</li>
            <li>To deliver a project you have commissioned, including all communication, scheduling, and administration.</li>
            <li>To process referrals and partnership enquiries.</li>
            <li>To operate the partner directory — Seller accounts, listings, and connecting buyers with Sellers.</li>
            <li>To stay in touch with past clients and contacts we have a genuine working relationship with (currently via Mailchimp).</li>
            <li>To understand how people use our website, so we can improve it.</li>
            <li>To meet our own legal, accounting, and tax obligations.</li>
          </ul>
          <p>We do not use your personal data for automated decision-making or profiling.</p>

          <h2>4. Our Legal Basis for Processing</h2>
          <p>
            We rely on the following lawful bases under UK GDPR, depending on the situation:
            <strong> Contract</strong> — where we need your information to provide a service you have asked for or
            agreed to pay for; <strong>Legitimate interests</strong> — where we need your information to respond to an
            enquiry, manage our relationship with you, operate the directory, stay in touch with existing contacts, or
            improve our services, and this does not unfairly affect your rights; <strong>Legal obligation</strong> —
            where we are required to keep certain records, such as for tax and accounting purposes.
          </p>

          <h2>5. Payments and Invoicing</h2>
          <p>
            We do not currently take payment through our website. Once a project is confirmed, we issue invoices
            directly by email, and payment is arranged separately between you and us. Details of how to pay are provided
            on the invoice itself.
          </p>

          <h2>6. Who We Share Your Information With</h2>
          <p>
            Your personal data is accessed by people working within Plistic who need it to do their job. We do not sell
            or rent your personal data to anyone. We share personal data only with the following organisations, where
            necessary to run our business:
          </p>
          <ul>
            <li><strong>Calendly</strong> — to manage bookings for discovery calls.</li>
            <li><strong>Google</strong> — for website analytics (Google Analytics).</li>
            <li><strong>Mailchimp</strong> — to manage our CRM and send email communications to existing contacts.</li>
            <li><strong>Supabase</strong> — the database, sign-in, and file storage that power the partner directory and our website forms.</li>
            <li><strong>Resend</strong> — to send transactional emails such as enquiry notifications, confirmations, and sign-in links.</li>
            <li><strong>Vercel</strong> — website and application hosting.</li>
            <li><strong>Our accountant</strong> — for invoicing, tax, and financial record-keeping.</li>
            <li>Any freelancer or third party we bring onto a specific project — only the information they need.</li>
            <li><strong>Directory Sellers</strong> — when you submit an enquiry on a listing, your enquiry details are shared with that Seller so they can respond to you.</li>
          </ul>
          <p>
            Some of these providers (including Calendly, Google, Mailchimp, Resend, and Vercel) are based in or transfer
            data to the United States. Where that happens, transfers are safeguarded under recognised UK data
            protection mechanisms — primarily the UK Extension to the EU-US Data Privacy Framework, backed up by
            Standard Contractual Clauses with the UK Addendum. These are the standard, legally recognised ways of
            protecting personal data transferred outside the UK.
          </p>

          <h2>7. How Long We Keep Your Information</h2>
          <ul>
            <li>Enquiries that do not become a project: up to 12 months, then deleted, unless you ask us to delete sooner.</li>
            <li>Client and project information: for the duration of our working relationship and 6 years afterwards, for tax and accounting.</li>
            <li>CRM contacts: for as long as we have an active relationship or reasonable basis to stay in touch, removed on request.</li>
            <li>Referral and partnership enquiries: for as long as relevant, then deleted.</li>
            <li>Directory Seller accounts and listings: for as long as your account is active; directory enquiries are retained in line with our enquiry retention above.</li>
          </ul>

          <h2>8. Your Rights</h2>
          <p>
            Under UK GDPR, you have the right to: ask us what personal data we hold about you and request a copy; ask us
            to correct inaccurate or incomplete data; ask us to delete your data where there is no legal reason to keep
            it; ask us to restrict or object to how we use your data in certain circumstances; and complain to the
            Information Commissioner&rsquo;s Office (ICO). To exercise any of these, contact us at{" "}
            <a href="mailto:hello@plisticmedia.com">hello@plisticmedia.com</a>. We will respond within one month. The
            ICO can be contacted at ico.org.uk or on 0303 123 1113.
          </p>

          <h2>9. Keeping Your Information Secure</h2>
          <p>
            We take reasonable technical and organisational steps to protect the personal data we hold, including
            restricting access to those who need it and using reputable, secure third-party tools for the services
            described in this policy.
          </p>

          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this policy from time to time as our business and website evolve. The version in effect is
            dated at the top of this document. We encourage you to check this page periodically.
          </p>

          <h2>11. Contact Us</h2>
          <p>
            If you have any questions about this policy or how we handle your personal data, please contact us at{" "}
            <a href="mailto:hello@plisticmedia.com">hello@plisticmedia.com</a>.
          </p>
          <p>
            Plistic is the trading name of Songplistic Ltd, a company registered in Scotland under company number
            SC699049. Registered office: 2 West Drive Cottage, Stracathro, Brechin, Scotland, DD9 7QF.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
