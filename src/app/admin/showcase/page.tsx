import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { ShowcaseItem } from "@/lib/showcase";
import { publishShowcaseItem, removeShowcaseItem } from "../actions";
import { ActionButton } from "@/components/ActionButton";
import { ShowcaseForm } from "./ShowcaseForm";
import styles from "./ShowcaseAdmin.module.css";

export const metadata: Metadata = { title: "Showcase — admin | Plistic", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ShowcaseAdminPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const { saved } = await searchParams;
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("showcase_items")
    .select("id, kind, title, summary, body, image_url, embed_url, link_url, source, location, event_date, is_featured, collection, status, published_at, submitter_email, created_at")
    .neq("status", "removed")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });
  const items = (data ?? []) as Array<ShowcaseItem & { status: string; submitter_email: string | null }>;
  const pending = items.filter((i) => i.status === "pending");
  const published = items.filter((i) => i.status === "published");

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.inner}`}>
          <p className={styles.kicker}><Link href="/admin">Admin</Link> / Showcase</p>
          <h1>Showcase stories</h1>
          <p className={styles.lead}>
            Write and publish stories, or review what people have submitted — all here, no code needed.
          </p>
          {saved && <p className={styles.saved} role="status">Saved and published. It&apos;s live on the showcase.</p>}

          <h2 className={styles.h2}>Write a new story</h2>
          <ShowcaseForm />

          {pending.length > 0 && (
            <>
              <h2 className={styles.h2}>Submitted for review ({pending.length})</h2>
              <ul className={styles.list}>
                {pending.map((i) => (
                  <li key={i.id} className={styles.rowItem}>
                    <div className={styles.rowMain}>
                      <strong>{i.title}</strong>
                      <span className={styles.rowMeta}>{i.kind}{i.submitter_email ? ` · ${i.submitter_email}` : ""}</span>
                    </div>
                    <div className={styles.rowActions}>
                      <Link className={styles.btnSmall} href={`/admin/showcase/${i.id}`}>Review &amp; edit</Link>
                      <ActionButton action={publishShowcaseItem.bind(null, i.id)} pendingText="Publishing…" className={styles.btnSmall}>
                        Publish
                      </ActionButton>
                      <ActionButton action={removeShowcaseItem.bind(null, i.id)} pendingText="Rejecting…" className={`${styles.btnSmall} ${styles.btnDanger}`}>
                        Reject
                      </ActionButton>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          <h2 className={styles.h2}>Live stories ({published.length})</h2>
          {published.length === 0 ? (
            <p className={styles.lead}>Nothing published yet.</p>
          ) : (
            <ul className={styles.list}>
              {published.map((i) => (
                <li key={i.id} className={styles.rowItem}>
                  <div className={styles.rowMain}>
                    <strong>{i.title}</strong>
                    <span className={styles.rowMeta}>{i.kind}{i.is_featured ? " · featured" : ""}</span>
                  </div>
                  <div className={styles.rowActions}>
                    <Link className={styles.btnSmall} href={`/admin/showcase/${i.id}`}>Edit</Link>
                    <ActionButton action={removeShowcaseItem.bind(null, i.id)} pendingText="Removing…" className={`${styles.btnSmall} ${styles.btnDanger}`}>
                      Remove
                    </ActionButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
