"use client";

import { useId, useRef, type ReactNode } from "react";

// Native <dialog> gives focus trapping, Escape handling and inert background without a dependency.
export function Dialog({
  trigger,
  triggerClassName,
  triggerLabel,
  title,
  description,
  children,
}: {
  trigger: ReactNode;
  triggerClassName?: string;
  triggerLabel?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const close = () => ref.current?.close();
  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        aria-label={triggerLabel}
        aria-haspopup="dialog"
        onClick={() => ref.current?.showModal()}
      >
        {trigger}
      </button>
      <dialog
        ref={ref}
        className="dialog"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        // Clicks on the backdrop target the dialog element itself.
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 id={titleId} className="text-lg font-semibold tracking-tight">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={close}
            className="btn btn-ghost -mr-2 -mt-1 h-9 w-9 p-0"
            aria-label="Close"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>
        <div className="max-h-[70dvh] overflow-y-auto px-6 py-5">{children}</div>
      </dialog>
    </>
  );
}
