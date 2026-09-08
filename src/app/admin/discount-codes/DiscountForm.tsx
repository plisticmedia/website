"use client";

import { useActionState } from "react";
import { DISCOUNT_SERVICE_LABELS, type DiscountService } from "@/lib/discounts";
import { createDiscountCode } from "./actions";

const SERVICE_ENTRIES = Object.entries(DISCOUNT_SERVICE_LABELS) as [DiscountService, string][];

const fieldStyle: React.CSSProperties = {
  padding: "0.5rem 0.7rem",
  border: "1px solid var(--p-line)",
  borderRadius: 8,
  font: "inherit",
  background: "var(--p-white, #fff)",
  color: "var(--p-ink)",
};
const labelStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.85rem", fontWeight: 600 };

/** Admin form for creating a new discount / quote code. */
export function DiscountForm({ buttonClassName }: { buttonClassName?: string }) {
  const [state, formAction, pending] = useActionState(createDiscountCode, null);

  return (
    <form action={formAction} style={{ display: "grid", gap: "0.8rem", marginTop: "0.7rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.8rem" }}>
        <label style={labelStyle}>
          <span>Code</span>
          <input name="code" required placeholder="EVENT50" style={{ ...fieldStyle, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }} />
        </label>
        <label style={labelStyle}>
          <span>Description (optional)</span>
          <input name="label" placeholder="50% off event filming days" style={fieldStyle} />
        </label>
        <label style={labelStyle}>
          <span>Discount type</span>
          <select name="discountType" defaultValue="percent" style={fieldStyle}>
            <option value="percent">Percentage off (%)</option>
            <option value="fixed">Fixed amount off (£)</option>
          </select>
        </label>
        <label style={labelStyle}>
          <span>Amount</span>
          <input name="discountValue" type="number" min="1" step="1" required placeholder="50" style={fieldStyle} />
        </label>
        <label style={labelStyle}>
          <span>Applies to</span>
          <select name="service" defaultValue="event" style={fieldStyle}>
            {SERVICE_ENTRIES.map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        </label>
        <label style={labelStyle}>
          <span>Expires (optional)</span>
          <input name="expiresAt" type="date" style={fieldStyle} />
        </label>
        <label style={labelStyle}>
          <span>Max uses (optional)</span>
          <input name="maxUses" type="number" min="1" step="1" placeholder="Unlimited" style={fieldStyle} />
        </label>
      </div>
      <div>
        <button type="submit" className={buttonClassName} disabled={pending}>
          {pending ? "Creating…" : "Create code"}
        </button>
      </div>
      {state && (
        <p
          role="status"
          style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.4, color: state.ok ? "#1a7f37" : "var(--p-coral, #f06d45)" }}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
