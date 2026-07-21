import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { requireUser } from "@/lib/auth";
import { getSellerServices } from "@/lib/services";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "./Listings.module.css";

export const metadata: Metadata = { title: "My listings | Plistic" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  pending: "In review",
  published: "Published",
  paused: "Paused",
  removed: "Removed",
};

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ claimed?: string }>;
}) {
  const profile = await requireUser("/dashboard/listings");
  const services = await getSellerServices(profile.id);
  const { claimed } = await searchParams;

  // Enquiry counts per listing for the insights line.
  const supabase = await createSupabaseServerClient();
  const { data: enq } = await supabase.from("enquiries").select("service_id").eq("seller_id", profile.id);
  const enquiryCount = new Map<string, number>();
  for (const e of (enq ?? []) as Array<{ service_id: string }>) {
    enquiryCount.set(e.service_id, (enquiryCount.get(e.service_id) ?? 0) + 1);
  }

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.inner}`}>
          {claimed && (
            <div
              role="status"
              style={{
                margin: "0 0 1.4rem",
                padding: "1rem 1.2rem",
                border: "1px solid var(--p-line)",
                borderRadius: 14,
                background: "rgba(31,170,233,0.08)",
              }}
            >
              <strong>Welcome — this listing is now yours.</strong>
              <p style={{ margin: "0.3rem 0 0", color: "var(--p-muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>
                Click it below to edit everything: your description, services and areas, photos and an embedded
                showreel, links, and availability. Buyer enquiries arrive in your{" "}
                <Link href="/dashboard/enquiries">inbox</Link> and by email. It&apos;s free to be listed.
              </p>
            </div>
          )}
          <header className={styles.head}>
            <div>
              <p className={styles.kicker}>
                <Link href="/dashboard">Dashboard</Link> / Listings
              </p>
              <h1>My listings</h1>
            </div>
            <Link href="/dashboard/listings/new" className="p-btn">
              <Plus aria-hidden="true" size={18} /> New listing
            </Link>
          </header>

          {services.length > 0 && (
            <p style={{ margin: "0 0 1.2rem", color: "var(--p-muted)", fontSize: "0.92rem", lineHeight: 1.5 }}>
              You can run more than one listing from this login — e.g. your company <em>and</em> a separate
              freelance profile, each with its own categories, enquiries and page.{" "}
              <Link href="/dashboard/listings/new" style={{ color: "var(--p-azure-deep)", fontWeight: 600 }}>Add another →</Link>{" "}
              <Link href="/directory/plistic-media" target="_blank" style={{ color: "var(--p-azure-deep)", fontWeight: 600 }}>See an example profile →</Link>
            </p>
          )}

          {services.length === 0 ? (
            <div className={styles.empty}>
              <p>You haven&apos;t created any listings yet.</p>
              <Link href="/dashboard/listings/new" className="p-btn">
                Create your first listing
              </Link>
            </div>
          ) : (
            <ul className={styles.list}>
              {services.map((s) => (
                <li key={s.id}>
                  <Link href={`/dashboard/listings/${s.id}`} className={styles.row}>
                    <div className={styles.rowThumb}>
                      {s.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.cover_image_url} alt="" />
                      ) : (
                        <span aria-hidden="true" />
                      )}
                    </div>
                    <div className={styles.rowMain}>
                      <strong>{s.title}</strong>
                      <span className={styles.rowMeta}>
                        {(s as { listing_type?: string }).listing_type === "individual" ? "Freelancer" : "Business"} ·{" "}
                        {s.categories?.name ?? "Uncategorised"} · {s.view_count ?? 0} view
                        {(s.view_count ?? 0) === 1 ? "" : "s"} · {enquiryCount.get(s.id) ?? 0} enquir
                        {(enquiryCount.get(s.id) ?? 0) === 1 ? "y" : "ies"}
                      </span>
                    </div>
                    <span className={`${styles.status} ${styles[`status_${s.status}`] ?? ""}`}>
                      {STATUS_LABEL[s.status] ?? s.status}
                    </span>
                  </Link>
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
