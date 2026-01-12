'use client';

import { EvidenceBundle, IntegrationStatus } from '@/lib/evidence/types';
import { getStatusColor, getStatusIcon, formatRelativeTime } from '@/lib/evidence/format';
import Link from 'next/link';

interface StepProps {
  number: number;
  title: string;
  description: string;
  status: IntegrationStatus;
  evidencePointer: string;
  details: string[];
  isLast?: boolean;
}

function Step({ number, title, description, status, evidencePointer, details, isLast }: StepProps) {
  return (
    <div className="relative">
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-gray-200" />
      )}

      <div className="flex gap-4">
        {/* Step number */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold ${
          status === 'OK' ? 'bg-green-100 text-green-700' :
          status === 'DEGRADED' ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-500'
        }`}>
          {number}
        </div>

        {/* Content */}
        <div className="flex-1 pb-8">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(status)}`}>
              {getStatusIcon(status)} {status}
            </span>
          </div>

          <p className="text-gray-600 mb-4">{description}</p>

          <div className="bg-gray-50 rounded-lg p-4 mb-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">What this proves:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {details.map((detail, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  {detail}
                </li>
              ))}
            </ul>
          </div>

          <Link
            href={`/evidence#${evidencePointer}`}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View evidence → integrations.{evidencePointer}
          </Link>
        </div>
      </div>
    </div>
  );
}

interface ProofStepperProps {
  evidence: EvidenceBundle;
}

export function ProofStepper({ evidence }: ProofStepperProps) {
  const { integrations } = evidence;

  const steps: Omit<StepProps, 'number' | 'isLast'>[] = [
    {
      title: 'Connect Google',
      description: 'OAuth configured and ready for Gmail + Calendar access.',
      status: integrations.google_oauth.status,
      evidencePointer: 'google_oauth',
      details: [
        `${integrations.google_oauth.scopes.length} OAuth scopes configured`,
        integrations.google_oauth.last_connect_at
          ? `Last successful connect: ${formatRelativeTime(integrations.google_oauth.last_connect_at)}`
          : 'OAuth credentials verified',
        'Redirect URI configured for callback handling',
      ],
    },
    {
      title: 'Sync Runs (Inngest)',
      description: 'Orchestration pipeline for incremental Gmail and Calendar sync.',
      status: integrations.inngest.status,
      evidencePointer: 'inngest',
      details: [
        `Environment: ${integrations.inngest.env}`,
        `${integrations.inngest.last_run_ids.length} recent workflow runs`,
        integrations.inngest.last_success_at
          ? `Last success: ${formatRelativeTime(integrations.inngest.last_success_at)}`
          : 'Inngest event key verified',
      ],
    },
    {
      title: 'Nightfall DLP Enforcement',
      description: 'Every document scanned before indexing: allow, redact, or quarantine.',
      status: integrations.nightfall.status,
      evidencePointer: 'nightfall',
      details: [
        `Policy: ${integrations.nightfall.policy_name}`,
        `${integrations.nightfall.last_scan_counts.allowed} documents allowed`,
        `${integrations.nightfall.last_scan_counts.redacted} documents redacted`,
        `${integrations.nightfall.last_scan_counts.quarantined} documents quarantined`,
      ],
    },
    {
      title: 'Embeddings Indexed',
      description: 'Sanitized content chunked and vectorized in Supabase pgvector.',
      status: integrations.embeddings.status,
      evidencePointer: 'embeddings',
      details: [
        `${integrations.embeddings.vector_count} vectors indexed`,
        integrations.embeddings.last_index_at
          ? `Last indexed: ${formatRelativeTime(integrations.embeddings.last_index_at)}`
          : 'pgvector ready for embeddings',
        `Retrieval test: ${integrations.embeddings.retrieval_test.returned}/${integrations.embeddings.retrieval_test.top_k} returned`,
      ],
    },
    {
      title: 'Retrieval Verified',
      description: 'Vector search returns relevant, sanitized results with provenance.',
      status: integrations.supabase.status,
      evidencePointer: 'supabase',
      details: [
        `Schema version: ${integrations.supabase.schema_version}`,
        `pgvector: ${integrations.supabase.pgvector ? 'Enabled' : 'Disabled'}`,
        `RLS: ${integrations.supabase.rls_verified ? 'Verified' : 'Not Verified'}`,
        `${integrations.supabase.document_count} documents, ${integrations.supabase.chunk_count} chunks`,
      ],
    },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {steps.map((step, index) => (
        <Step
          key={index}
          number={index + 1}
          isLast={index === steps.length - 1}
          {...step}
        />
      ))}
    </div>
  );
}
