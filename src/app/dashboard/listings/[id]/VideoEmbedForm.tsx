"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addEmbed } from "../actions";
import styles from "../Listings.module.css";

/**
 * Add a showreel/video link (YouTube, Vimeo or Google Drive) with any problem
 * shown inline instead of crashing to the error page.
 */
export function VideoEmbedForm({ serviceId }: { serviceId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function submit() {
    const url = inputRef.current?.value.trim() ?? "";
    if (!url) {
      setError("Please paste a video link.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("showreel", url);
      const res = await addEmbed(serviceId, fd);
      if (!res.ok) {
        setError(res.error ?? "Couldn't add that link. Please try again.");
        return;
      }
      if (inputRef.current) inputRef.current.value = "";
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add that link. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.uploadForm} style={{ flexWrap: "wrap" }}>
      <input
        ref={inputRef}
        type="url"
        placeholder="YouTube, Vimeo, Google Drive — or a direct .mp4 link"
        style={{ flex: 1, minWidth: "240px" }}
        disabled={busy}
        onChange={() => setError(null)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
      />
      <button type="button" onClick={submit} disabled={busy} className="p-btn p-btn--ghost">
        {busy ? "Adding…" : "Add video"}
      </button>
      {error && (
        <p role="alert" style={{ width: "100%", margin: "0.4rem 0 0", color: "#b4231f", fontSize: "0.88rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}
