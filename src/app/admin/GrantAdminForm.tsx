"use client";

import { useActionState } from "react";
import { grantAdmin } from "./actions";

/** Grant-admin form with visible success/error feedback. */
export function GrantAdminForm({ buttonClassName }: { buttonClassName?: string }) {
  const [state, formAction, pending] = useActionState(grantAdmin, null);

  return (
    <div style={{ marginTop: "0.7rem" }}>
      <form action={formAction} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input
          name="email"
          type="email"
          required
          placeholder="email of an existing account"
          style={{ flex: 1, minWidth: 220, padding: "0.5rem 0.7rem", border: "1px solid var(--p-line)", borderRadius: 8 }}
        />
        <button type="submit" className={buttonClassName} disabled={pending}>
          {pending ? "Granting…" : "Grant admin"}
        </button>
      </form>
      {state && (
        <p
          role="status"
          style={{
            marginTop: "0.5rem",
            fontSize: "0.85rem",
            lineHeight: 1.4,
            color: state.ok ? "#1a7f37" : "var(--p-coral, #f06d45)",
          }}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
