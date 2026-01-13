'use client';

import { cn } from '@/lib/utils';
import { ReactNode, useId, useMemo, useState } from 'react';

interface DetailsDisclosureProps {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children?: ReactNode;
  json?: unknown;
  className?: string;
  contentClassName?: string;
}

export function DetailsDisclosure({
  title,
  description,
  defaultOpen = false,
  children,
  json,
  className,
  contentClassName,
}: DetailsDisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  const jsonText = useMemo(() => {
    if (!open || json === undefined) return null;
    try {
      return JSON.stringify(json, null, 2);
    } catch {
      return 'Unable to render JSON.';
    }
  }, [json, open]);

  return (
    <div className={cn('rounded-xl border border-neutral-200 bg-neutral-50/60', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full flex items-start justify-between gap-3 px-4 py-3 text-left',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-xl'
        )}
        aria-expanded={open}
        aria-controls={contentId}
      >
        <span className="min-w-0">
          <span className="block text-body-sm font-medium text-neutral-900">{title}</span>
          {description && (
            <span className="mt-1 block text-body-xs text-neutral-600">{description}</span>
          )}
        </span>
        <svg
          className={cn('mt-0.5 w-5 h-5 flex-shrink-0 text-neutral-500 transition-transform', open && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div id={contentId} className="px-4 pb-4">
          {json !== undefined ? (
            <pre
              className={cn(
                'rounded-xl bg-neutral-900 text-neutral-100 p-4 text-body-sm overflow-x-auto',
                contentClassName
              )}
            >
              {jsonText}
            </pre>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}
