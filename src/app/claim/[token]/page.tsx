import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { getSessionProfile } from "@/lib/auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { toDisplayImage, initialOf } from "@/lib/images";
import { claimListing, optOut } from "./actions";
import styles from "./Claim.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Claim your listing | Plistic", robots: { index: false } };

type Row = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  website_url: string | null;
  seller_id: string | null;
  status: string;
  source: string | null;
};

export default async function ClaimPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { token } = await params;
  const { status } = await searchParams;

  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("services")
    .select("id, slug, title, summary, logo_url, cover_image_url, website_url, seller_id, status, source")
    .eq("claim_token", token)
    .maybeSingle();
  const svc = data as Row | null;
  if (!svc) notFound();

  const profile = await getSessionProfile();
  const logo = toDisplayImage(svc.logo_url) ?? toDisplayImage(svc.cover_image_url);
  const removed = svc.status === "removed" || status === "removed";
  const claimed = !!svc.seller_id || status === "claimed";
  const pending = status === "pending";

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.wrap}`}>
          <div className={styles.card}>
            <div className={styles.head}>
              <span className={styles.logo} aria-hidden="true">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt="" />
                ) : (
                  <span className={styles.logoInitial}>{initialOf(svc.title)}</span>
                )}
              </span>
              <div>
                <p className={styles.kicker}>Directory listing</p>
                <h1>{svc.title}</h1>
                {svc.summary && <p className={styles.summary}>{svc.summary}</p>}
              </div>
            </div>

            {removed ? (
              <div className={styles.notice}>
                <CheckCircle2 aria-hidden="true" size={20} />
                <p>This listing has been removed from the directory. If that was a mistake, email hello@plisticmedia.com.</p>
              </div>
            ) : claimed ? (
              <div className={styles.notice}>
                <CheckCircle2 aria-hidden="true" size={20} />
                <p>
                  This listing has already been claimed. If it&apos;s yours,{" "}
                  <Link href="/dashboard/listings">manage it in your dashboard</Link>.
                </p>
              </div>
            ) : pending ? (
              <div className={styles.notice}>
                <CheckCircle2 aria-hidden="true" size={20} />
                <p>Thanks — your claim is being reviewed. We&apos;ll email you once it&apos;s approved (usually within a day).</p>
              </div>
            ) : (
              <>
                <h2 className={styles.q}>Is this your business?</h2>
                <p className={styles.lead}>
                  Claim it to take control — edit your profile, add photos and a showreel, and receive enquiries
                  directly. It&apos;s free.
                </p>

                {profile ? (
                  <form action={claimListing.bind(null, token)} className={styles.form}>
                    <label className={styles.check}>
                      <input type="checkbox" name="marketing" />
                      <span>Keep me updated about Plistic (optional).</span>
                    </label>
                    <button type="submit" className="p-btn">Claim this listing</button>
                  </form>
                ) : (
                  <>
                    <Link href={`/login?next=${encodeURIComponent(`/claim/${token}`)}`} className="p-btn">
                      Sign in to claim
                    </Link>
                    <p className={styles.hint}>
                      You&apos;ll sign in with your email — that&apos;s how we confirm it&apos;s you. Use your business
                      email (matching your website) and it&apos;s approved instantly.
                    </p>
                  </>
                )}

                <form action={optOut.bind(null, token)} className={styles.optOut}>
                  <button type="submit" className={styles.optOutBtn}>This isn&apos;t my business / remove it</button>
                </form>
              </>
            )}

            <p className={styles.privacy}>
              <ShieldCheck aria-hidden="true" size={14} />
              {svc.source
                ? "This listing was compiled from publicly available business information. "
                : ""}
              We only hold public business details until you claim it, when you confirm consent. You can remove it any
              time with the button above. See our <Link href="/privacy">privacy notice</Link>.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
