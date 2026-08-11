"use client";

import { FormEvent, useState } from "react";

export function BetaSignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [business, setBusiness] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("busy");
    setError(null);
    try {
      const res = await fetch("/api/beta-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, business, company }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setStatus("idle");
        return;
      }
      setStatus("done");
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <p className="coming-soon-beta-done" role="status">
        You&apos;re in — thanks for joining the beta! Check your inbox: we&apos;ve emailed your access password and
        everything you need to get started.
      </p>
    );
  }

  return (
    <form className="coming-soon-beta-form" onSubmit={submit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        aria-label="Your name"
        autoComplete="name"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        aria-label="Email address"
        autoComplete="email"
        required
      />
      <input
        type="text"
        value={business}
        onChange={(e) => setBusiness(e.target.value)}
        placeholder="Business name (optional)"
        aria-label="Business name (optional)"
        autoComplete="organization"
      />
      <input
        type="text"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />
      <button type="submit" className="button button-primary" disabled={status === "busy"}>
        {status === "busy" ? "Signing you up…" : "Become a beta tester"}
      </button>
      {error && (
        <p className="coming-soon-beta-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
