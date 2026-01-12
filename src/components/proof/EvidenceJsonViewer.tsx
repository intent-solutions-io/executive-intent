'use client';

import { useState } from 'react';
import { EvidenceBundle } from '@/lib/evidence/types';

interface EvidenceJsonViewerProps {
  evidence: EvidenceBundle;
}

export function EvidenceJsonViewer({ evidence }: EvidenceJsonViewerProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800">
        <span className="text-gray-300 font-mono text-sm">evidence.json</span>
        <div className="flex items-center gap-2">
          <a
            href="/evidence/evidence.json"
            download
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Download
          </a>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-400 hover:text-gray-300"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>
      <pre
        className={`p-4 text-sm text-gray-300 overflow-x-auto ${
          expanded ? '' : 'max-h-96'
        } overflow-y-auto`}
      >
        <code>{JSON.stringify(evidence, null, 2)}</code>
      </pre>
    </div>
  );
}
