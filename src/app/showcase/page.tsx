import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Plus } from "lucide-react";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { getShowcaseItems, showcaseHref, toShowcaseEmbed, type ShowcaseItem, type ShowcaseKind } from "@/lib/showcase";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import styles from "./Showcase.module.css";

export const metadata: Metadata = {
  title: "Best of Scotland — creative showcase | Plistic",
  description:
    "A curated showcase of the best creative, arts and media work coming out of Scotland — films, music, events and stories worth celebrating.",
};

export const dynamic = "force-dynamic";

const KIND_TABS: Array<{ slug: string; label: string; kind?: ShowcaseKind }> = [
  { slug: "", label: "Everything" },
  { slug: "video", label: "Film & video", kind: "video" },
  { slug: "work", label: "Standout work", kind: "work" },
  { slug: "event", label: "Events", kind: "event" },
  { slug: "news", label: "News", kind: "news" },
  { slug: "image", label: "Images", kind: "image" },
];

function InternalOrExternal({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  if (href.startsWith("/")) {
    return <Link href={href} className={className}>{children}</Link>;
  }
  return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>;
}

function ShowcaseCard({ item, featured = false }: { item: ShowcaseItem; featured?: boolean }) {
  const embed = item.kind === "video" ? toShowcaseEmbed(item.embed_url) : null;
  const href = showcaseHref(item);
  const eventDate = item.event_date
    ? new Date(item.event_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <article className={`${styles.card} ${featured ? styles.cardFeatured : ""}`}>
      {embed ? (
        <div className={styles.media}>
          <iframe
            src={embed}
            title={item.title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : item.image_url ? (
        <InternalOrExternal href={href ?? "#"} className={styles.mediaLink}>
          <div className={styles.media}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image_url} alt={item.title} loading="lazy" />
          </div>
        </InternalOrExternal>
      ) : null}

      <div className={styles.cardBody}>
        <div className={styles.metaRow}>
          <span className={styles.kindTag}>{labelForKind(item.kind)}</span>
          {eventDate && (
            <span className={styles.eventDate}>
              <CalendarDays aria-hidden="true" size={13} /> {eventDate}
            </span>
          )}
        </div>
        <h3>{item.title}</h3>
        {(item.summary || item.body) && <p className={styles.cardText}>{item.summary ?? excerpt(item.body)}</p>}
        <div className={styles.cardFoot}>
          {item.source && (
            <span className={styles.source}>{item.location ? `${item.source} · ${item.location}` : item.source}</span>
          )}
          {href && (
            <InternalOrExternal href={href} className={styles.readMore}>
              {item.body ? "Read the story" : item.kind === "news" ? "Read more" : "View"}{" "}
              <ArrowRight aria-hidden="true" size={14} />
            </InternalOrExternal>
          )}
        </div>
      </div>
    </article>
  );
}

function labelForKind(kind: ShowcaseKind): string {
  return kind === "work" ? "Work" : kind === "video" ? "Film" : kind.charAt(0).toUpperCase() + kind.slice(1);
}
function excerpt(body: string | null): string {
  if (!body) return "";
  return body.length > 200 ? `${body.slice(0, 200).trimEnd()}…` : body;
}

export default async function ShowcasePage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind } = await searchParams;
  const activeTab = KIND_TABS.find((t) => t.slug === kind) ?? KIND_TABS[0];
  const items = await getShowcaseItems(activeTab.kind);

  const [lead, ...rest] = items;

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className="p-container">
            <p className={styles.kicker}>Best of Scotland</p>
            <h1>
              Scotland&apos;s creative scene, <span>celebrated</span>.
            </h1>
            <p className={styles.lead}>
              A curated showcase of the best film, music, events and stories coming out of Scotland — and the people
              making them. Discovered something brilliant? Put it forward.
            </p>
            <div className={styles.heroActions}>
              <Link href="/showcase/submit" className="p-btn">
                <Plus aria-hidden="true" size={18} /> Submit work or a story
              </Link>
              <Link href="/directory" className={styles.heroSecondary}>
                Browse the directory <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
          </div>
        </section>

        <section className={`p-container ${styles.body}`}>
          <nav className={styles.tabs} aria-label="Filter showcase">
            {KIND_TABS.map((t) => (
              <Link
                key={t.slug || "all"}
                href={t.slug ? `/showcase?kind=${t.slug}` : "/showcase"}
                className={activeTab.slug === t.slug ? styles.tabActive : styles.tab}
              >
                {t.label}
              </Link>
            ))}
          </nav>

          {items.length === 0 ? (
            <p className={styles.empty}>
              Nothing here yet. <Link href="/showcase/submit">Submit something brilliant</Link> to get the showcase going.
            </p>
          ) : (
            <>
              {lead && !activeTab.kind && <ShowcaseCard item={lead} featured />}
              <div className={styles.grid}>
                {(activeTab.kind ? items : rest).map((item) => (
                  <ShowcaseCard key={item.id} item={item} />
                ))}
              </div>
            </>
          )}
        </section>

        <section className={`p-container ${styles.signupSection}`}>
          <NewsletterSignup source="showcase" />
        </section>
      </main>
      <Footer />
    </>
  );
}
