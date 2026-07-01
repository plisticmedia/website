import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { requireAdmin } from "@/lib/auth";
import { ImportForm } from "./ImportForm";
import styles from "../Admin.module.css";

export const metadata: Metadata = { title: "Import listings | Plistic admin" };
export const dynamic = "force-dynamic";

export default async function ImportPage() {
  await requireAdmin();

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.inner}`}>
          <p className={styles.kicker}>
            <Link href="/admin">Admin</Link> / Import
          </p>
          <h1>Import listings from CSV</h1>
          <p style={{ color: "var(--p-muted)", margin: "0.5rem 0 1.4rem", maxWidth: "60ch" }}>
            Export your sign-up sheet as a CSV (in Google Sheets: File → Download → CSV) and upload it
            here. Missing service and location categories are created automatically. Columns are matched
            by name — recognised headers include: name, services, description, location, website, logo,
            address, postcode, instagram, linkedin, and a founding/trusted-partner flag. Re-importing the
            same sheet is safe (existing listings are skipped by name).
          </p>
          <ImportForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
