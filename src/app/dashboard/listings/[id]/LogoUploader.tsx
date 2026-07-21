"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { uploadLogo } from "../actions";
import styles from "../Listings.module.css";

/**
 * Logo upload: a single image, with errors shown inline rather than crashing to
 * the error page. The logo is NOT recompressed so transparent PNGs keep their
 * transparency.
 */
export function LogoUploader({ serviceId, hasLogo }: { serviceId: string; hasLogo: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function submit() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Please choose a logo image.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const res = await uploadLogo(serviceId, fd);
      if (!res.ok) {
        setError(res.error ?? "Upload failed. Please try again.");
        return;
      }
      if (inputRef.current) inputRef.current.value = "";
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.uploadForm} style={{ flexWrap: "wrap" }}>
      <input ref={inputRef} type="file" accept="image/*" disabled={busy} onChange={() => setError(null)} />
      <button type="button" onClick={submit} disabled={busy} className="p-btn p-btn--ghost">
        <Upload aria-hidden="true" size={16} /> {busy ? "Uploading…" : hasLogo ? "Replace logo" : "Upload logo"}
      </button>
      {error && (
        <p role="alert" style={{ width: "100%", margin: "0.4rem 0 0", color: "#b4231f", fontSize: "0.88rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}
