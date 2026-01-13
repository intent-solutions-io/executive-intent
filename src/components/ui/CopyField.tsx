'use client';

import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';

interface CopyFieldProps {
  value: string;
  label?: string;
  truncate?: boolean;
  className?: string;
}

export function CopyField({ value, label, truncate = false, className }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [value]);

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <span className="text-body-xs text-neutral-500 uppercase tracking-wider font-medium">
          {label}
        </span>
      )}
      <div className="flex items-center gap-2">
        <code
          className={cn(
            'font-mono text-body-sm bg-neutral-100 px-2 py-1 rounded text-neutral-800',
            truncate && 'truncate max-w-[200px]'
          )}
          title={truncate ? value : undefined}
        >
          {value}
        </code>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 p-1.5 rounded hover:bg-neutral-100 transition-colors text-neutral-500 hover:text-neutral-700"
          aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
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
