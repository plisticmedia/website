import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { resourceTopics } from "@/data/site";

export function Resources() {
  return (
    <section className="resources-section section-band" id="resources" aria-labelledby="resources-title">
      <div className="section-inner resources-layout">
        <div>
          <p className="eyebrow">Blog and resources</p>
          <h2 id="resources-title">A home for search, GEO, and genuinely useful media guidance.</h2>
          <p>
            The blog can launch with clear categories, structured metadata, and a newsletter sign-up ready for
            Mailchimp or MailerLite.
          </p>
          <div className="topic-list">
            {resourceTopics.map((topic) => (
              <span key={topic}>{topic}</span>
            ))}
          </div>
        </div>
        <form className="newsletter-form" aria-label="Newsletter sign-up">
          <Mail aria-hidden="true" size={24} />
          <h3>Get Plistic notes</h3>
          <p>Media production, launch lessons, and practical strategy from the Plistic team.</p>
          <label>
            Email address
            <input type="email" name="email" placeholder="you@example.com" />
          </label>
          <button type="submit">
            Join the list
            <ArrowRight aria-hidden="true" size={16} />
          </button>
        </form>
      </div>
    </section>
  );
}

