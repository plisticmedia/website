"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminSetLogo } from "./actions";

/**
 * Admin: set/replace a listing's logo from the Businesses table — works for any
 * listing, including unclaimed ones being curated on a business's behalf. Shows
 * a small thumbnail + inline status; no crash-to-error-page on failure.
 */
export function AdminLogoUpload({ serviceId, logoUrl }: { serviceId: string; logoUrl: string | null }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function onChange() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const res = await adminSetLogo(serviceId, fd);
      if (!res.ok) {
        setErr(res.error ?? "Upload failed.");
        return;
      }
      setMsg("Logo updated ✓");
      if (inputRef.current) inputRef.current.value = "";
      startTransition(() => router.refresh());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          style={{ width: 26, height: 26, borderRadius: 5, objectFit: "contain", background: "#fff", border: "1px solid var(--p-line)" }}
        />
      )}
      <label
        style={{ fontSize: "0.72rem", color: "var(--p-azure-deep)", fontWeight: 600, cursor: busy ? "default" : "pointer" }}
      >
        {busy ? "Uploading…" : logoUrl ? "Replace logo" : "Set logo"}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={onChange}
          style={{ display: "none" }}
        />
      </label>
      {msg && <span style={{ fontSize: "0.7rem", color: "#1f8a52" }}>{msg}</span>}
      {err && <span style={{ fontSize: "0.7rem", color: "#b4231f" }}>{err}</span>}
    </div>
  );
}
