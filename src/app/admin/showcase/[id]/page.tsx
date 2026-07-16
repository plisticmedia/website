import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { ShowcaseItem } from "@/lib/showcase";
import { ShowcaseForm } from "../ShowcaseForm";
import styles from "../ShowcaseAdmin.module.css";

export const metadata: Metadata = { title: "Edit showcase story | Plistic", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EditShowcasePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("showcase_items")
    .select("id, kind, title, summary, body, image_url, embed_url, link_url, source, location, event_date, is_featured, collection, published_at")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const item = data as ShowcaseItem;

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.inner}`}>
          <p className={styles.kicker}>
            <Link href="/admin">Admin</Link> / <Link href="/admin/showcase">Showcase</Link> / Edit
          </p>
          <h1>Edit story</h1>
          <p className={styles.lead}>Make your changes and save — it publishes straight to the showcase.</p>
          <ShowcaseForm item={item} />
        </section>
      </main>
      <Footer />
    </>
  );
}
