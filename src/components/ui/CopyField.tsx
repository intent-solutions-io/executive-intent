'use client';

import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';
import { useToast } from './Toast';

interface CopyFieldProps {
  value: string;
  copyValue?: string;
  displayValue?: string;
  label?: string;
  truncate?: boolean;
  className?: string;
}

export function CopyField({ value, copyValue, displayValue, label, truncate = false, className }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const copyText = copyValue ?? value;
  const shownText = displayValue ?? value;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      toast(label ? `${label} copied` : 'Copied');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast('Copy failed');
    }
  }, [copyText, label, toast]);

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <span className="text-body-xs text-neutral-700 uppercase tracking-wider font-medium">
          {label}
        </span>
      )}
      <div className="flex items-center gap-2 min-w-0">
        <code
          className={cn(
            'flex-1 min-w-0 font-mono text-body-sm bg-neutral-100 border border-neutral-200/70 px-2.5 py-1.5 rounded-lg text-neutral-900',
            truncate ? 'truncate whitespace-nowrap' : 'break-all whitespace-normal'
          )}
          title={truncate ? shownText : undefined}
        >
          {shownText}
        </code>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-700 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          aria-label={copied ? `${label ?? 'Value'} copied` : `Copy ${label ?? 'value'}`}
        >
          {copied ? (
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
