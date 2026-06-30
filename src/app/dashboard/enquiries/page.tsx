import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { setEnquiryStatus } from "./actions";
import styles from "./Enquiries.module.css";

export const metadata: Metadata = { title: "Enquiries | Plistic" };
export const dynamic = "force-dynamic";

type EnquiryRow = {
  id: string;
  buyer_name: string;
  buyer_email: string;
  message: string;
  status: "new" | "responded" | "closed";
  created_at: string;
  services: { title: string; slug: string } | null;
};

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  responded: "Responded",
  closed: "Closed",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function EnquiriesPage() {
  await requireUser("/dashboard/enquiries");
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("enquiries")
    .select("id, buyer_name, buyer_email, message, status, created_at, services ( title, slug )")
    .order("created_at", { ascending: false });

  const enquiries = (data ?? []) as unknown as EnquiryRow[];
  const newCount = enquiries.filter((e) => e.status === "new").length;

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.inner}`}>
          <p className={styles.kicker}>
            <Link href="/dashboard">Dashboard</Link> / Enquiries
          </p>
          <h1>Enquiries{newCount > 0 ? ` (${newCount} new)` : ""}</h1>
          <p className={styles.sub}>
            Buyers contact you here and by email. Reply to them directly at the address shown.
          </p>

          {enquiries.length === 0 ? (
            <p className={styles.empty}>No enquiries yet. They&apos;ll appear here when buyers get in touch.</p>
          ) : (
            <ul className={styles.list}>
              {enquiries.map((e) => (
                <li key={e.id} className={`${styles.card} ${e.status === "new" ? styles.cardNew : ""}`}>
                  <div className={styles.cardTop}>
                    <div>
                      <strong>{e.buyer_name}</strong>{" "}
                      <a href={`mailto:${e.buyer_email}`} className={styles.email}>
                        {e.buyer_email}
                      </a>
                      <div className={styles.meta}>
                        {e.services?.title ? (
                          <>
                            Re: <em>{e.services.title}</em> ·{" "}
                          </>
                        ) : null}
                        {formatDate(e.created_at)}
                      </div>
                    </div>
                    <span className={`${styles.status} ${styles[`status_${e.status}`] ?? ""}`}>
                      {STATUS_LABEL[e.status]}
                    </span>
                  </div>

                  <p className={styles.message}>{e.message}</p>

                  <div className={styles.actions}>
                    <a href={`mailto:${e.buyer_email}?subject=${encodeURIComponent(`Re: your Plistic enquiry${e.services?.title ? ` about ${e.services.title}` : ""}`)}`} className="p-btn">
                      Reply by email
                    </a>
                    {e.status !== "responded" && (
                      <form action={setEnquiryStatus.bind(null, e.id, "responded")}>
                        <button type="submit" className="p-btn p-btn--ghost">Mark responded</button>
                      </form>
                    )}
                    {e.status !== "closed" && (
                      <form action={setEnquiryStatus.bind(null, e.id, "closed")}>
                        <button type="submit" className={styles.closeBtn}>Close</button>
                      </form>
                    )}
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
