"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { PASSWORD_HINT, passwordError } from "@/lib/password";

const wrap: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.6rem",
  padding: "0 0.85rem",
  border: "1px solid var(--p-line)",
  borderRadius: "12px",
  background: "var(--p-paper, #f7f9f9)",
  color: "var(--p-muted)",
};
const input: React.CSSProperties = { flex: 1, padding: "0.7rem 0", border: "none", background: "transparent", font: "inherit", color: "var(--p-ink)" };

export function ChangePasswordForm() {
  const [showPw, setShowPw] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const password = String(fd.get("password") ?? "");
    const confirm = String(fd.get("confirm") ?? "");
    const err = passwordError(password);
    if (err) { setStatus("error"); setMessage(err); return; }
    if (password !== confirm) { setStatus("error"); setMessage("The two passwords don't match."); return; }
    setStatus("saving");
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      form.reset();
      setStatus("done");
      setMessage("Password updated.");
    } catch (error) {
      setStatus("error");
      const msg = error && typeof error === "object" && "message" in error ? String((error as { message: unknown }).message) : "";
      setMessage(
        /aal2/i.test(msg)
          ? "For security, sign out and back in (completing your 2FA), then change your password."
          : msg || "Could not update your password. Please try again.",
      );
    }
  }

  if (status === "done") {
    return (
      <p style={{ display: "flex", gap: "0.5rem", alignItems: "center", color: "#1a7f37" }}>
        <CheckCircle2 aria-hidden="true" size={18} /> {message}
      </p>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.7rem", maxWidth: 420 }}>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.85rem", fontWeight: 600 }}>
        <span>New password</span>
        <div style={wrap}>
          <Lock aria-hidden="true" size={18} />
          <input name="password" type={showPw ? "text" : "password"} autoComplete="new-password" placeholder="Your new password" minLength={8} required style={input} />
          <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--p-muted)", display: "inline-flex", padding: "0.3rem" }}>
            {showPw ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
          </button>
        </div>
      </label>
      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--p-muted)", lineHeight: 1.4 }}>{PASSWORD_HINT}</p>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.85rem", fontWeight: 600 }}>
        <span>Confirm new password</span>
        <div style={wrap}>
          <Lock aria-hidden="true" size={18} />
          <input name="confirm" type={showPw ? "text" : "password"} autoComplete="new-password" placeholder="Re-enter your password" minLength={8} required style={input} />
        </div>
      </label>
      <button type="submit" className="p-btn" disabled={status === "saving"} style={{ alignSelf: "flex-start" }}>
        {status === "saving" ? "Saving…" : "Update password"}
      </button>
      {status === "error" && <p style={{ color: "var(--p-coral, #f06d45)", fontSize: "0.85rem", margin: 0 }}>{message}</p>}
    </form>
  );
}
