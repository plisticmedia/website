import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Banknote, CheckCircle2, Handshake, MailCheck, UsersRound } from "lucide-react";
import { Footer } from "@/components/Footer";
import { LaunchBanner } from "@/components/LaunchBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { PartnerForm, ReferralForm } from "./EarnForms";
import styles from "./EarnPage.module.css";

export const metadata: Metadata = {
  title: "Earn With Us | Plistic",
  description:
    "Refer qualifying Plistic projects for a 10% first-project referral fee, or explore a longer-term creative partnership.",
};

const referralSteps = [
  {
    icon: MailCheck,
    title: "Submit the referral",
    body: "Send us the contact details and whatever you know about the project. A description helps, but it is optional.",
  },
  {
    icon: CheckCircle2,
    title: "Our team checks it",
    body: "We confirm receipt, notify the Plistic team, and check that the referral was submitted before the client contacted us another way.",
  },
  {
    icon: Banknote,
    title: "You get paid fairly",
    body: "If the referral becomes a paid first project with a new Plistic client, you receive 10% once the client's invoice is settled.",
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
                Referrals are quick: anyone can recommend a new client and earn a cash thank you if it turns into paid
                work. Partnerships are different: slower, more considered relationships with creative businesses whose
                services complement ours.
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
                <p>Choose the route</p>
              </div>
              <div className={styles.panelSplit}>
                <article className={`${styles.panelCard} ${styles.referralPanel}`}>
                  <div className={styles.panelCardHeader}>
                    <Banknote aria-hidden="true" size={22} />
                    <span>Referrals</span>
                  </div>
                  <strong>10% cash reward</strong>
                  <p>
                    A quick route for anyone who sends us a new client. If their first paid Plistic project qualifies,
                    you receive 10% once the invoice is settled.
                  </p>
                  <p className={styles.panelExample}>Example: &pound;500 on a &pound;5,000 first project.</p>
                  <Link className={styles.panelLink} href="#referral">
                    Submit a referral
                    <ArrowRight aria-hidden="true" size={16} />
                  </Link>
                </article>

                <article className={`${styles.panelCard} ${styles.partnershipPanel}`}>
                  <div className={styles.panelCardHeader}>
                    <Handshake aria-hidden="true" size={22} />
                    <span>Partnerships</span>
                  </div>
                  <strong>Creative network</strong>
                  <p>
                    A longer-term route for businesses and freelancers whose services complement ours. No referral
                    cash: this is about trusted repeat collaboration.
                  </p>
                  <Link className={styles.panelLink} href="#partners">
                    Become a partner
                    <ArrowRight aria-hidden="true" size={16} />
                  </Link>
                </article>
              </div>
            </aside>
          </div>
        </section>

        <section className={styles.introBand} aria-label="Programme overview">
          <div className={`p-container ${styles.introGrid}`}>
            <article>
              <Banknote aria-hidden="true" size={26} />
              <h2>Simple, fair, trackable.</h2>
              <p>
                Anyone can submit a referral. If it becomes a new client's first paid Plistic project, you receive 10%
                of that project value once the client's invoice is settled.
              </p>
            </article>
            <article>
              <Handshake aria-hidden="true" size={26} />
              <h2>Partnerships with intent.</h2>
              <p>
                Partnerships are for businesses and freelancers we may work with repeatedly. They are about shared
                standards and complementary services, not a one-off referral fee.
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
                For example, refer someone who signs a &pound;5,000 project and you would receive &pound;500.
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
                This is a longer-term relationship rather than a cash referral route. For now, tell us who you are,
                what you do, and where your work could fit alongside Plistic projects.
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
