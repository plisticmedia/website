import { directoryPublic } from "@/lib/directory";

/**
 * Beta-only note pointing testers to where the payment (test-card) instructions
 * live. Hidden once the directory is live (real payments), so real buyers never
 * see it.
 */
export function TestPaymentNote() {
  if (directoryPublic()) return null;
  return (
    <p
      style={{
        margin: "0.7rem 0 0",
        fontSize: "0.8rem",
        lineHeight: 1.5,
        color: "var(--p-muted)",
      }}
    >
      <strong>Testing payments?</strong> The test card and instructions are in the welcome email you got when you
      signed up as a beta tester — or in a separate email if you&apos;re one of our first 100 testers.
    </p>
  );
}
