import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Lock } from "lucide-react";
import styles from "./DirectoryAccess.module.css";

export const metadata: Metadata = {
  title: "Directory access | Plistic",
  robots: { index: false, follow: false },
};

type Props = { searchParams?: Promise<{ error?: string; next?: string }> };

function safeNext(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/directory";
  return value;
}

export default async function DirectoryAccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const nextPath = safeNext(params?.next);
  const hasError = params?.error === "1";

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <Image
          src="/assets/brand/plistic-media.png"
          alt="Plistic Media"
          width={150}
          height={69}
          priority
          className={styles.logo}
        />
        <span className={styles.badge}>
          <Lock aria-hidden="true" size={13} /> Private beta
        </span>
        <h1 className={styles.title}>Media Directory</h1>
        <p className={styles.lead}>
          The directory is in private beta. Enter the access password to take a look.
        </p>
        <form action="/api/site-access" method="post" className={styles.form}>
          <input type="hidden" name="next" value={nextPath} />
          <input type="hidden" name="from" value="/directory-access" />
          <label htmlFor="da-password" className={styles.srOnly}>
            Access password
          </label>
          <input
            id="da-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Access password"
            required
            className={styles.input}
          />
          <button type="submit" className={styles.submit}>
            Enter the directory
          </button>
          {hasError && (
            <p role="alert" className={styles.error}>
              That password didn&apos;t work — please try again.
            </p>
          )}
        </form>
        <Link href="/coming-soon" className={styles.betaBtn}>
          Don&apos;t know the password? Sign up to be a beta tester
        </Link>
        <p className={styles.help}>It&apos;s free, and we&apos;ll email you the password.</p>
        <Link href="/" className={styles.back}>
          ← Back to homepage
        </Link>
      </div>
    </main>
  );
}
