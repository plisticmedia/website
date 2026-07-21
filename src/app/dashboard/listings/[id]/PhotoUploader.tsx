"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { uploadMedia } from "../actions";
import { compressPhoto } from "@/lib/compressImage";
import styles from "../Listings.module.css";

/**
 * Photo upload for a listing: choose several at once, resized in the browser
 * before upload, with any problems shown inline instead of crashing to the
 * error page.
 */
export function PhotoUploader({ serviceId }: { serviceId: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function submit() {
    if (files.length === 0) {
      setError("Please choose at least one photo.");
      return;
    }
    setBusy(true);
    setError(null);
    setStatus(`Uploading ${files.length} photo${files.length === 1 ? "" : "s"}…`);
    try {
      const fd = new FormData();
      for (const f of files) fd.append("file", await compressPhoto(f));
      const res = await uploadMedia(serviceId, fd);
      if (res.errors.length > 0) setError(res.errors.join(" "));
      setStatus(res.uploaded > 0 ? `Added ${res.uploaded} photo${res.uploaded === 1 ? "" : "s"}.` : null);
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.uploadForm} style={{ flexWrap: "wrap" }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        disabled={busy}
        onChange={(e) => {
          setFiles(Array.from(e.target.files ?? []));
          setError(null);
          setStatus(null);
        }}
      />
      <button type="button" onClick={submit} disabled={busy} className="p-btn p-btn--ghost">
        <Upload aria-hidden="true" size={16} />{" "}
        {busy ? "Uploading…" : files.length > 1 ? `Upload ${files.length} photos` : "Upload"}
      </button>
      {status && (
        <p role="status" style={{ width: "100%", margin: "0.4rem 0 0", color: "var(--p-muted)", fontSize: "0.88rem" }}>
          {status}
        </p>
      )}
      {error && (
        <p role="alert" style={{ width: "100%", margin: "0.4rem 0 0", color: "#b4231f", fontSize: "0.88rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}
