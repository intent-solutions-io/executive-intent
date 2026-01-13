'use client';

import { useState, useMemo } from 'react';
import { EvidenceBundle } from '@/lib/evidence/types';

interface EvidenceJsonViewerProps {
  evidence: EvidenceBundle;
  defaultExpanded?: boolean;
}

export function EvidenceJsonViewer({ evidence, defaultExpanded = false }: EvidenceJsonViewerProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Only stringify when expanded to save memory/CPU on mobile
  const jsonContent = useMemo(() => {
    if (!expanded) {
      // Show a preview of the structure
      return JSON.stringify({
        product: evidence.product,
        generated_at: evidence.generated_at,
        builder: evidence.builder,
        commit: '...',
        ci: '...',
        deploy: '...',
        integrations: '...',
        pipeline_health: '...',
        redactions: '...',
      }, null, 2);
    }
    return JSON.stringify(evidence, null, 2);
  }, [expanded, evidence]);

  return (
    <div className="bg-neutral-900 rounded-xl overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 bg-neutral-800 gap-2">
        <span className="text-neutral-300 font-mono text-sm">evidence.json</span>
        <div className="flex items-center gap-3">
          <a
            href="/evidence/evidence.json"
            download
            className="text-xs text-primary-400 hover:text-primary-300 font-medium"
          >
            Download
          </a>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1 font-medium"
          >
            <svg
              className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {expanded ? 'Collapse' : 'Expand Full'}
          </button>
        </div>
      </div>

      {/* Collapsed state shows preview */}
      {!expanded && (
        <div className="px-4 py-3 border-t border-neutral-700">
          <p className="text-xs text-neutral-400 mb-2">
            Preview (click Expand Full to see complete JSON)
          </p>
        </div>
      )}

      {/* JSON content with horizontal scroll */}
      <div className="relative">
        <pre
          className={`p-4 text-sm text-neutral-300 overflow-x-auto ${
            expanded ? 'max-h-[600px]' : 'max-h-48'
          } overflow-y-auto scrollbar-hide`}
        >
          <code>{jsonContent}</code>
        </pre>

        {/* Fade overlay when collapsed */}
        {!expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-neutral-900 to-transparent pointer-events-none" />
        )}
      </div>
    </div>
  );
}
