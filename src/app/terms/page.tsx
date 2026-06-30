import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { brand } from "@/data/site";
import styles from "../legal/Legal.module.css";

export const metadata: Metadata = {
  title: "Terms | Plistic",
  description: "Terms of use for Plistic's website, services and partner directory.",
};

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.inner}`}>
          <p className={styles.kicker}>Legal</p>
          <h1>Terms of use</h1>
          <p className={styles.updated}>Last updated 30 June 2026</p>

          <p>
            These terms govern your use of the Plistic website, our production services, and the Plistic partner
            directory (the &ldquo;Directory&rdquo;). By using the site you agree to them. Plistic is a media
            production company based in Glasgow, Scotland.
          </p>

          <h2>1. The Directory is an introduction service</h2>
          <div className={styles.callout}>
            The Directory lists independent creative and media providers (&ldquo;Sellers&rdquo;). Plistic simply
            introduces buyers and Sellers. <strong>Plistic is not a party to any contract, agreement, or
            transaction between a buyer and a Seller</strong>, takes no commission on those transactions, and is
            not responsible for the work, conduct, pricing, or deliverables of any Seller. Any agreement you make
            with a Seller is solely between you and that Seller.
          </div>

          <h2>2. Listings and pricing</h2>
          <p>
            Prices shown on listings are indicative and provided by Sellers for information only. They are not
            offers capable of acceptance and do not create a contract. Buyers should confirm all scope, pricing,
            and terms directly with the Seller.
          </p>

          <h2>3. Seller accounts and responsibilities</h2>
          <p>By creating a Seller account you agree that:</p>
          <ul>
            <li>The information in your profile and listings is accurate and not misleading.</li>
            <li>You own or are licensed to use all content (text, images, video) you upload, and it does not infringe anyone&rsquo;s rights.</li>
            <li>You will respond to buyer enquiries honestly and lawfully, and deal with buyers in good faith.</li>
            <li>You will not post unlawful, offensive, or fraudulent content.</li>
            <li>Plistic may review, pause, edit, or remove any listing, and suspend any account, at its discretion — for example to keep the Directory accurate and trustworthy.</li>
          </ul>

          <h2>4. Trusted Partner / featured status</h2>
          <p>
            Plistic may highlight selected listings as &ldquo;Trusted Partner&rdquo; or featured entries. Featured
            placement may be offered free at Plistic&rsquo;s discretion or as a paid subscription. Featured status
            is editorial promotion within the Directory only and does not imply Plistic endorses, guarantees, or is
            responsible for that Seller&rsquo;s work.
          </p>

          <h2>5. Enquiries</h2>
          <p>
            When you submit an enquiry on a listing, your name, email, and message are shared with the relevant
            Seller (and with Plistic) so the Seller can respond to you directly. Do not include sensitive personal
            information in an enquiry.
          </p>

          <h2>6. Referrals</h2>
          <p>
            Where Plistic operates a referral arrangement, a referral fee (currently 10% of the confirmed, paid
            project value) is payable only once the referred client&rsquo;s invoice with Plistic is settled, subject
            to any separate referral terms agreed in writing.
          </p>

          <h2>7. Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, Plistic is not liable for any loss arising from your dealings
            with a Seller or buyer, from reliance on listing content, or from use of the Directory. Nothing in these
            terms limits liability that cannot be limited under law (for example, for death or personal injury caused
            by negligence, or for fraud).
          </p>

          <h2>8. Changes and governing law</h2>
          <p>
            We may update these terms from time to time; the current version always applies. These terms are
            governed by the law of Scotland, and the Scottish courts have exclusive jurisdiction.
          </p>

          <h2>9. Contact</h2>
          <p>
            Questions about these terms? Email <a href={`mailto:${brand.email}`}>{brand.email}</a>.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
