import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Clapperboard,
  Clock,
  MessagesSquare,
  Pencil,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { getSessionProfile } from "@/lib/auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { toDisplayImage, initialOf } from "@/lib/images";
import { LAUNCH_DATE } from "@/lib/claimInvite";
import { claimListing, optOut } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
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

/** Whole days from today until the public launch — drives the "still time" banner. */
function daysUntilLaunch(): number | null {
  const launch = new Date(`${LAUNCH_DATE} 23:59:59`);
  if (Number.isNaN(launch.getTime())) return null;
  const ms = launch.getTime() - Date.now();
  return ms <= 0 ? 0 : Math.ceil(ms / 86_400_000);
}

const BENEFITS = [
  { icon: Pencil, title: "Edit everything", body: "Your description, services, contact details and links — all in your control." },
  { icon: Camera, title: "Show your work", body: "Upload photos of past projects and build a gallery buyers can browse." },
  { icon: Clapperboard, title: "Add your showreel", body: "Embed a reel or video so people see what you do, not just read it." },
  { icon: MessagesSquare, title: "Get enquiries direct", body: "People looking for exactly what you do reach you here — no middleman." },
];

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
  const cover = toDisplayImage(svc.cover_image_url);
  const removed = svc.status === "removed" || status === "removed";
  const claimed = !!svc.seller_id || status === "claimed";
  const pending = status === "pending";

  const days = daysUntilLaunch();
  const featuredOffer =
    days === null
      ? null
      : days <= 0
        ? "We&rsquo;ve launched — claim now to appear across the directory."
        : `Claim before we launch on ${LAUNCH_DATE} and ${svc.title} is featured from day one.`;

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.wrap}`}>
          <div className={styles.card}>
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <div className={styles.cover} style={{ backgroundImage: `url(${cover})` }} aria-hidden="true" />
            )}
            <div className={`${styles.head} ${cover ? styles.headWithCover : ""}`}>
              <span className={styles.logo} aria-hidden="true">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt="" />
                ) : (
                  <span className={styles.logoInitial}>{initialOf(svc.title)}</span>
                )}
              </span>
              <div>
                <p className={styles.kicker}>Your Plistic page</p>
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
                {featuredOffer && (
                  <div className={styles.offer}>
                    <Sparkles aria-hidden="true" size={18} />
                    <p dangerouslySetInnerHTML={{ __html: featuredOffer }} />
                  </div>
                )}

                <h2 className={styles.q}>This page is already built — it&apos;s yours to claim.</h2>
                <p className={styles.lead}>
                  {`We put ${svc.title} on Plistic, the new home for Scotland’s creative and media scene. Claiming it takes about two minutes, it’s completely free, and then you’re in control.`}
                </p>

                <ul className={styles.benefits}>
                  {BENEFITS.map((b) => (
                    <li key={b.title}>
                      <span className={styles.benefitIcon} aria-hidden="true"><b.icon size={18} /></span>
                      <span>
                        <strong>{b.title}</strong>
                        {b.body}
                      </span>
                    </li>
                  ))}
                </ul>

                {profile ? (
                  <form action={claimListing.bind(null, token)} className={styles.form}>
                    <label className={styles.check}>
                      <input type="checkbox" name="marketing" />
                      <span>Keep me updated about Plistic (optional).</span>
                    </label>
                    <SubmitButton pendingText="Claiming…" className={`p-btn ${styles.cta}`}>
                      Claim this page <ArrowRight aria-hidden="true" size={18} />
                    </SubmitButton>
                  </form>
                ) : (
                  <div className={styles.signinRow}>
                    <Link href={`/login?next=${encodeURIComponent(`/claim/${token}`)}`} className={`p-btn ${styles.cta}`}>
                      Sign in to claim your page <ArrowRight aria-hidden="true" size={18} />
                    </Link>
                    <p className={styles.hint}>
                      <Clock aria-hidden="true" size={14} />
                      <span>
                        You&apos;ll sign in with your email — that&apos;s how we confirm it&apos;s you. Use your business
                        email (the one on your website) and it&apos;s approved instantly.
                      </span>
                    </p>
                  </div>
                )}

                <Link href={`/directory/${svc.slug}`} className={styles.preview}>
                  See how your page looks first <ArrowRight aria-hidden="true" size={15} />
                </Link>

                <form action={optOut.bind(null, token)} className={styles.optOut}>
                  <SubmitButton pendingText="Removing…" className={styles.optOutBtn}>This isn&apos;t my business / remove it</SubmitButton>
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
