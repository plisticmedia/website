import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { getShowcaseItemById, toShowcaseEmbed } from "@/lib/showcase";
import styles from "./Story.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = await getShowcaseItemById(id);
  if (!item) return { title: "Showcase | Plistic" };
  return {
    title: `${item.title} | Plistic Showcase`,
    description: item.summary ?? undefined,
    openGraph: item.image_url ? { images: [{ url: item.image_url }] } : undefined,
  };
}

export default async function ShowcaseStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getShowcaseItemById(id);
  if (!item) notFound();

  const embed = item.kind === "video" ? toShowcaseEmbed(item.embed_url) : null;
  const date = item.published_at
    ? new Date(item.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const eventDate = item.event_date
    ? new Date(item.event_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const paragraphs = (item.body ?? "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const kindLabel: Record<string, string> = {
    news: "News", work: "Standout work", event: "Event", video: "Film & video", image: "Image",
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": item.kind === "news" ? "NewsArticle" : "Article",
    headline: item.title,
    ...(item.summary ? { description: item.summary } : {}),
    ...(item.image_url ? { image: [item.image_url] } : {}),
    ...(item.published_at ? { datePublished: item.published_at } : {}),
    author: { "@type": "Organization", name: item.source || "Plistic" },
    publisher: { "@type": "Organization", name: "Plistic" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main className={styles.page}>
        <article className={`p-container ${styles.inner}`}>
          <Link href="/showcase" className={styles.back}>
            <ArrowLeft aria-hidden="true" size={16} /> Back to the showcase
          </Link>

          <p className={styles.kicker}>{kindLabel[item.kind] ?? "Showcase"}</p>
          <h1 className={styles.title}>{item.title}</h1>

          <div className={styles.meta}>
            {item.source && <span>{item.source}</span>}
            {item.location && <span>{item.location}</span>}
            {eventDate && <span>{eventDate}</span>}
            {!eventDate && date && <span>{date}</span>}
          </div>

          {embed ? (
            <div className={styles.media}>
              <iframe src={embed} title={item.title} allow="encrypted-media; fullscreen" allowFullScreen loading="lazy" />
            </div>
          ) : item.image_url ? (
            <div className={styles.mediaImage}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image_url} alt={item.title} />
            </div>
          ) : null}

          {item.summary && <p className={styles.lead}>{item.summary}</p>}

          {paragraphs.length > 0 && (
            <div className={styles.body}>
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}

          {item.link_url && (
            <p className={styles.sourceLink}>
              {item.link_url.startsWith("/") ? (
                <Link href={item.link_url}>Read more <ExternalLink aria-hidden="true" size={14} /></Link>
              ) : (
                <a href={item.link_url} target="_blank" rel="noopener noreferrer">
                  Read the full source <ExternalLink aria-hidden="true" size={14} />
                </a>
              )}
            </p>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}
