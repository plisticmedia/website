"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

/**
 * Submit button for a `<form action={serverAction}>` that shows a pending state
 * while the action runs — so form submissions (which carry FormData) never feel
 * dead. Use this instead of a plain <button type="submit"> inside server-action
 * forms. For buttons that don't need FormData, prefer <ActionButton>.
 */
export function SubmitButton({
  children,
  pendingText,
  className,
}: {
  children: ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? pendingText ?? "Working…" : children}
    </button>
  );
}
