import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createTaxon, deleteTaxon, renameTaxon } from "../actions";
import styles from "../Admin.module.css";

export const metadata: Metadata = { title: "Taxonomy | Plistic admin" };
export const dynamic = "force-dynamic";

type Taxon = "categories" | "locations";
type Row = { id: string; name: string; slug: string; sort_order: number };

export default async function TaxonomyPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const [cats, locs] = await Promise.all([
    supabase.from("categories").select("id, name, slug, sort_order").order("sort_order"),
    supabase.from("locations").select("id, name, slug, sort_order").order("sort_order"),
  ]);

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.inner}`}>
          <p className={styles.kicker}>
            <Link href="/admin">Admin</Link> / Taxonomy
          </p>
          <h1>Services &amp; locations</h1>
          <p style={{ color: "var(--p-muted)", marginTop: "0.4rem" }}>
            Add, rename, or remove the categories that power the directory filters. Changes go live
            immediately — no developer needed.
          </p>

          <TaxonTable kind="categories" title="Service categories" rows={(cats.data ?? []) as Row[]} />
          <TaxonTable kind="locations" title="Locations" rows={(locs.data ?? []) as Row[]} />
        </section>
      </main>
      <Footer />
    </>
  );
}

function TaxonTable({ kind, title, rows }: { kind: Taxon; title: string; rows: Row[] }) {
  return (
    <>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th style={{ width: "5rem" }}>Order</th>
              <th style={{ width: "12rem" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className={styles.emptyCell}>None yet.</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <form action={renameTaxon.bind(null, kind, r.id)} style={{ display: "flex", gap: "0.4rem" }}>
                    <input name="name" defaultValue={r.name} className={styles.inlineInput} aria-label="Name" />
                    <input
                      name="sort_order"
                      defaultValue={r.sort_order}
                      className={styles.inlineInputNarrow}
                      aria-label="Sort order"
                    />
                    <button type="submit" className={styles.btnSmall}>Save</button>
                  </form>
                </td>
                <td>{r.slug}</td>
                <td>{r.sort_order}</td>
                <td>
                  <form action={deleteTaxon.bind(null, kind, r.id)}>
                    <button type="submit" className={`${styles.btnSmall} ${styles.btnDanger}`}>
                      <Trash2 aria-hidden="true" size={13} /> Remove
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form action={createTaxon.bind(null, kind)} className={styles.addRow}>
        <input name="name" placeholder={`New ${kind === "categories" ? "service" : "location"} name`} required className={styles.inlineInput} />
        <input name="sort_order" placeholder="Order" defaultValue="100" className={styles.inlineInputNarrow} />
        <button type="submit" className="p-btn">
          <Plus aria-hidden="true" size={16} /> Add
        </button>
      </form>
    </>
  );
}
