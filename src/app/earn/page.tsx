import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Banknote, Clock3, Handshake, MailCheck, Percent, UsersRound } from "lucide-react";
import { Footer } from "@/components/Footer";
import { LaunchBanner } from "@/components/LaunchBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { PartnerForm, ReferralForm } from "./EarnForms";
import styles from "./EarnPage.module.css";

export const metadata: Metadata = {
  title: "Earn With Us | Plistic",
  description:
    "Refer paid Plistic projects for a 10% fee, or join the trusted creative partner network we are building across Scotland.",
};

const referralSteps = [
  {
    icon: MailCheck,
    title: "Submit the referral",
    body: "Send us the contact details and whatever you know about the project. A description helps, but it is optional.",
  },
  {
    icon: Clock3,
    title: "Jessie follows up",
    body: "We confirm receipt automatically, notify the Plistic team, and Jessie follows up with the referred contact within 24 hours.",
  },
  {
    icon: Banknote,
    title: "You get paid fairly",
    body: "If the referral becomes a confirmed, paid project, you receive 10% of the total project value once the client's invoice is settled.",
  },
];

const partnerTypes = [
  "Photographers",
  "Social media agencies",
  "Animators",
  "PR specialists",
  "Paid media teams",
  "Creative studios",
];

export default function EarnPage() {
  return (
    <>
      <LaunchBanner />
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="earn-title">
          <div className={`p-container ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>Earn With Us</p>
              <h1 id="earn-title">
                Build the <span>network</span> with us.
              </h1>
              <p className={styles.heroLead}>
                Referrals and partnerships belong together because they are both about the same thing: building a
                network of people who benefit from working with Plistic.
              </p>
              <div className={styles.heroActions}>
                <Link className="p-btn" href="#referral">
                  Submit a referral
                  <ArrowRight aria-hidden="true" size={18} />
                </Link>
                <Link className={`p-btn ${styles.ghost}`} href="#partners">
                  <Handshake aria-hidden="true" size={18} />
                  Become a partner
                </Link>
              </div>
            </div>

            <aside className={`${styles.heroPanel} p-vf`} aria-label="Earn with us summary">
              <span className="p-vfc" aria-hidden="true" />
              <div className={styles.panelHeader}>
                <UsersRound aria-hidden="true" size={24} />
                <p>Two ways to work with Plistic</p>
              </div>
              <div className={styles.panelRows}>
                <div className={styles.panelRow}>
                  <span>Referral fee</span>
                  <strong>10%</strong>
                  <p>of any confirmed, paid project you send our way.</p>
                </div>
                <div className={styles.panelRow}>
                  <span>Follow-up time</span>
                  <strong>24h</strong>
                  <p>Jessie follows up with the referred contact within one working day.</p>
                </div>
                <div className={styles.panelRow}>
                  <span>Partner launch</span>
                  <strong>5</strong>
                  <p>trusted partners across different creative functions before the directory goes live.</p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className={styles.introBand} aria-label="Programme overview">
          <div className={`p-container ${styles.introGrid}`}>
            <article>
              <Percent aria-hidden="true" size={26} />
              <h2>Simple, fair, trackable.</h2>
              <p>
                Anyone who refers a client that results in a confirmed, paid project gets 10% of that project's total
                value, paid once the client's invoice is settled.
              </p>
            </article>
            <article>
              <Handshake aria-hidden="true" size={26} />
              <h2>Partnerships with intent.</h2>
              <p>
                We are building a trusted Scottish creative ecosystem around services that complement ours, without
                rushing a public directory before the relationships are confirmed.
              </p>
            </article>
          </div>
        </section>

        <section className={styles.section} id="referral" aria-labelledby="referral-title">
          <div className={`p-container ${styles.programmeGrid}`}>
            <div className={styles.programmeCopy}>
              <p className="p-eyebrow">Referral programme</p>
              <h2 id="referral-title">Send good projects our way. Share fairly when they land.</h2>
              <p>
                If you know someone who needs podcasting, video production, event filming, or documentary work, send
                them through here. We will track the referral, confirm we have received it, and keep the process clean.
              </p>
              <div className={styles.steps} aria-label="Referral process">
                {referralSteps.map((step, index) => {
                  const Icon = step.icon;

                  return (
                    <article className={styles.step} key={step.title}>
                      <div className={styles.stepIcon}>
                        <Icon aria-hidden="true" size={19} />
                      </div>
                      <div>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <h3>{step.title}</h3>
                        <p>{step.body}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
            <ReferralForm />
          </div>
        </section>

        <section className={`${styles.section} ${styles.partnerSection}`} id="partners" aria-labelledby="partners-title">
          <div className={`p-container ${styles.programmeGrid}`}>
            <div className={styles.programmeCopy}>
              <p className="p-eyebrow">Partnership programme</p>
              <h2 id="partners-title">A trusted creative network, built carefully.</h2>
              <p>
                We are building a network of trusted partners in the Scottish creative ecosystem: people and businesses
                whose services complement ours and whose work we would feel confident putting beside Plistic projects.
              </p>
              <p>
                The plan is to launch with around five confirmed partners across different functions before the partner
                directory goes fully live. For now, tell us who you are and where your work fits.
              </p>
              <div className={styles.partnerTags} aria-label="Partner categories we are interested in">
                {partnerTypes.map((type) => (
                  <span key={type}>{type}</span>
                ))}
              </div>
            </div>
            <PartnerForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
