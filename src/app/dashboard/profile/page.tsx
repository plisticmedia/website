import type { Metadata } from "next";
import Link from "next/link";
import { Upload } from "lucide-react";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateProfile, uploadAvatar } from "./actions";
import styles from "../listings/Listings.module.css";

export const metadata: Metadata = { title: "Profile | Plistic" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await requireUser("/dashboard/profile");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("display_name, bio, website_url, avatar_url")
    .eq("id", profile.id)
    .single();

  const isBusiness = profile.accountType === "business" || profile.role === "admin";

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={`p-container ${styles.innerNarrow}`}>
          <p className={styles.kicker}>
            <Link href="/dashboard">Dashboard</Link> / Profile
          </p>
          <h1>{isBusiness ? "Your public profile" : "Your profile"}</h1>
          <p className={styles.sub}>
            {isBusiness ? "This is what buyers see on your listings." : "Your name and details for enquiries and orders."}
          </p>

          <form action={uploadAvatar} className={styles.uploadForm}>
            {data?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.avatar_url}
                alt="Your avatar"
                width={64}
                height={64}
                style={{ borderRadius: "50%", objectFit: "cover" }}
              />
            ) : null}
            <input type="file" name="file" accept="image/*" required />
            <button type="submit" className="p-btn p-btn--ghost">
              <Upload aria-hidden="true" size={16} /> {data?.avatar_url ? "Change photo" : "Upload photo"}
            </button>
          </form>

          <form action={updateProfile} className={styles.form}>
            <label className={styles.field}>
              <span>Display name</span>
              <input
                name="display_name"
                type="text"
                maxLength={120}
                defaultValue={data?.display_name ?? ""}
                placeholder="Your name or studio name"
              />
            </label>
            <label className={styles.field}>
              <span>Bio</span>
              <textarea
                name="bio"
                rows={5}
                maxLength={1000}
                defaultValue={data?.bio ?? ""}
                placeholder="A short introduction shown on your listings."
              />
            </label>
            <label className={styles.field}>
              <span>Website</span>
              <input
                name="website_url"
                type="text"
                maxLength={300}
                defaultValue={data?.website_url ?? ""}
                placeholder="yourstudio.com"
              />
            </label>
            <button type="submit" className="p-btn">Save profile</button>
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
}
