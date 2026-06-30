import Link from "next/link";
import { ArrowRight, Banknote, Handshake, UsersRound } from "lucide-react";

export function EarnWithUs() {
  return (
    <section className="earn-section section-band" id="earn" aria-labelledby="earn-title">
      <div className="section-inner earn-layout">
        <div className="earn-intro">
          <p className="eyebrow">Earn With Us</p>
          <h2 id="earn-title">A simple network for referrals and creative partners.</h2>
          <p>
            Refer a new client and receive 10% of their first paid Plistic project if it qualifies. Photographers,
            agencies, animators, PR teams, paid media specialists, and other collaborators can also start a longer-term
            partner conversation with us.
          </p>
        </div>
        <div className="earn-cards">
          <article>
            <Banknote aria-hidden="true" size={26} />
            <h3>Referral programme</h3>
            <p>Receive 10% of a qualifying new client's first paid project. A &pound;5,000 project would mean &pound;500.</p>
            <Link href="/earn#referral">
              Submit a referral
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </article>
          <article>
            <Handshake aria-hidden="true" size={26} />
            <h3>Partner programme</h3>
            <p>Build a considered creative relationship with Plistic when our services naturally complement each other.</p>
            <Link href="/earn#partners">
              Become a partner
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </article>
          <article>
            <UsersRound aria-hidden="true" size={26} />
            <h3>Clean tracking</h3>
            <p>Referral submissions trigger confirmation and internal notifications so our team can track the introduction.</p>
            <Link href="/earn#referral">
              See the workflow
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
