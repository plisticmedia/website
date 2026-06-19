import Link from "next/link";
import { ArrowRight, Handshake, Percent, UsersRound } from "lucide-react";

export function EarnWithUs() {
  return (
    <section className="earn-section section-band" id="earn" aria-labelledby="earn-title">
      <div className="section-inner earn-layout">
        <div className="earn-intro">
          <p className="eyebrow">Earn With Us</p>
          <h2 id="earn-title">A simple network for referrals and creative partners.</h2>
          <p>
            The launch page can explain the 10% referral programme and invite photographers, agencies,
            animators, PR teams, paid media specialists, and other collaborators to start a conversation.
          </p>
        </div>
        <div className="earn-cards">
          <article>
            <Percent aria-hidden="true" size={26} />
            <h3>Referral programme</h3>
            <p>Refer a confirmed paid project and receive 10% of the project value once the invoice is settled.</p>
            <Link href="/earn#referral">
              Submit a referral
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </article>
          <article>
            <Handshake aria-hidden="true" size={26} />
            <h3>Partner programme</h3>
            <p>Build a trusted Scottish creative ecosystem before the full partner directory goes live.</p>
            <Link href="/earn#partners">
              Become a partner
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </article>
          <article>
            <UsersRound aria-hidden="true" size={26} />
            <h3>24-hour follow-up</h3>
            <p>Referral submissions can trigger confirmation and internal notifications for Jessie to follow up.</p>
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
