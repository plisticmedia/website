import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { experimentSections } from "@/data/site";

export const metadata = {
  title: "Plistic Section Experiments",
};

export default function ExperimentsPage() {
  return (
    <main className="experiments-page">
      <section className="experiments-hero">
        <p className="eyebrow">Review space</p>
        <h1>Plistic section experiments</h1>
        <p>
          These are standalone HTML variations for human review. Once a direction is selected, the matching
          section can be implemented in the Next.js homepage.
        </p>
        <Link className="section-link" href="/">
          Back to homepage
          <ArrowUpRight aria-hidden="true" size={18} />
        </Link>
      </section>

      <section className="experiments-list" aria-label="Section experiment links">
        {experimentSections.map((section) => (
          <article key={section.title}>
            <h2>{section.title}</h2>
            <div>
              {section.links.map((link) => (
                <Link key={link.href} href={link.href} target="_blank">
                  {link.label}
                  <ArrowUpRight aria-hidden="true" size={16} />
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

