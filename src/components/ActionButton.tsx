"use client";

import { useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

/**
 * A button that runs a server action with immediate feedback and a guaranteed
 * refresh. It shows a pending state while the action runs (so it never feels
 * dead), then calls router.refresh() so the current page's data updates without
 * a manual reload — regardless of revalidatePath timing.
 *
 * Pass a bound server action, e.g.
 *   <ActionButton action={publishShowcaseItem.bind(null, id)}>Publish</ActionButton>
 */
export function ActionButton({
  action,
  children,
  pendingText,
  className,
  confirm,
  onDone,
}: {
  action: () => Promise<unknown>;
  children: ReactNode;
  pendingText?: string;
  className?: string;
  confirm?: string;
  onDone?: () => void;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      aria-busy={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          try {
            await action();
          } finally {
            router.refresh();
            onDone?.();
          }
        });
      }}
    >
      {pending ? pendingText ?? "Working…" : children}
    </button>
  );
}
