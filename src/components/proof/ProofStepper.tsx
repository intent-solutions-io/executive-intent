'use client';

import { useState } from 'react';
import Image from 'next/image';
import { EvidenceBundle, IntegrationStatus } from '@/lib/evidence/types';
import { getStatusColor, getStatusIcon, getStatusLabel, formatRelativeTime, formatRationale } from '@/lib/evidence/format';
import Link from 'next/link';

interface StepProps {
  number: number;
  title: string;
  description: string;
  status: IntegrationStatus;
  evidencePointer: string;
  details: string[];
  screenshotPath?: string;
  isLast?: boolean;
}

/**
 * Get step circle style based on status
 * - verified: Green (proven)
 * - processing/connected: Blue (in progress)
 * - configured: Gray (not yet proven)
 * - degraded: Yellow (warning)
 * - error: Red (failed)
 */
function getStepCircleStyle(status: IntegrationStatus): string {
  switch (status) {
    case 'verified':
      return 'bg-green-100 text-green-700 border-green-300';
    case 'processing':
    case 'connected':
      return 'bg-blue-100 text-blue-700 border-blue-300';
    case 'configured':
      return 'bg-gray-100 text-gray-500 border-gray-300';
    case 'degraded':
      return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    case 'error':
      return 'bg-red-100 text-red-700 border-red-300';
    default:
      return 'bg-gray-100 text-gray-500 border-gray-300';
  }
}

/**
 * Get checkmark style for "What this proves" items
 * Only verified gets a green checkmark; others get a neutral indicator
 */
function getCheckmarkStyle(status: IntegrationStatus): string {
  switch (status) {
    case 'verified':
      return 'text-green-500';
    case 'processing':
    case 'connected':
      return 'text-blue-500';
    case 'degraded':
      return 'text-yellow-500';
    case 'error':
      return 'text-red-500';
    default:
      return 'text-gray-400';
  }
}

function getCheckmarkIcon(status: IntegrationStatus): string {
  switch (status) {
    case 'verified':
      return '✓';
    case 'processing':
    case 'connected':
      return '◉';
    case 'degraded':
      return '⚠';
    case 'error':
      return '✗';
    default:
      return '○';
  }
}

function Step({ number, title, description, status, evidencePointer, details, screenshotPath, isLast }: StepProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="relative">
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-gray-200" />
      )}

      <div className="flex gap-4">
        {/* Step number */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold border-2 ${getStepCircleStyle(status)}`}>
          {number}
        </div>

        {/* Content */}
        <div className="flex-1 pb-8">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(status)}`}>
              {getStatusIcon(status)} {getStatusLabel(status)}
            </span>
          </div>

          <p className="text-gray-600 mb-4">{description}</p>

          {/* Screenshot evidence */}
          {screenshotPath && !imageError && (
            <div className="mb-4 rounded-lg border overflow-hidden shadow-sm">
              <Image
                src={screenshotPath}
                alt={`${title} - vendor dashboard screenshot`}
                width={800}
                height={450}
                className="w-full h-auto"
                onError={() => setImageError(true)}
              />
              <div className="bg-gray-50 px-3 py-2 text-xs text-gray-500 border-t">
                Vendor dashboard screenshot
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 mb-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">What this proves:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {details.map((detail, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className={`mt-0.5 ${getCheckmarkStyle(status)}`}>
                    {getCheckmarkIcon(status)}
                  </span>
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

  // Get retrieval test info
  const rt = integrations.embeddings.retrieval_test;
  const retrievalTestStr = rt.query_count > 0
    ? `${rt.success_count}/${rt.query_count} ${rt.passed ? 'passed' : 'below threshold'}`
    : 'Not run yet';

  const steps: Omit<StepProps, 'number' | 'isLast'>[] = [
    {
      title: 'Connect Google',
      description: 'OAuth configured and ready for Gmail + Calendar access.',
      status: integrations.google_oauth.status,
      evidencePointer: 'google_oauth',
      // No screenshot - OAuth config is internal, proof is in Supabase data
      details: [
        `${integrations.google_oauth.scopes.length} OAuth scopes configured`,
        `Token: ${integrations.google_oauth.token_valid ? 'Valid' : 'Not yet validated'}`,
        integrations.google_oauth.last_connect_at
          ? `Last successful connect: ${formatRelativeTime(integrations.google_oauth.last_connect_at)}`
          : 'Awaiting first user connection',
        `Status rationale: ${formatRationale(integrations.google_oauth.rationale)}`,
      ],
    },
    {
      title: 'Documents Synced (Supabase)',
      description: 'Gmail and Calendar data synced to Supabase database.',
      status: integrations.supabase.status,
      evidencePointer: 'supabase',
      screenshotPath: '/demo-assets/screens/step-1-supabase-documents.png',
      details: [
        `${integrations.supabase.document_count} documents synced`,
        `${integrations.supabase.chunk_count} chunks created`,
        `${integrations.supabase.vector_count} vectors indexed`,
        `Schema version: ${integrations.supabase.schema_version}`,
        `RLS: ${integrations.supabase.rls_verified ? 'Verified' : 'Not Verified'}`,
      ],
    },
    {
      title: 'Embeddings Indexed (Supabase)',
      description: 'Sanitized content vectorized in Supabase pgvector.',
      status: integrations.embeddings.status,
      evidencePointer: 'embeddings',
      screenshotPath: '/demo-assets/screens/step-2-supabase-embeddings.png',
      details: [
        `${integrations.embeddings.vector_count} vectors indexed`,
        `pgvector: ${integrations.supabase.pgvector ? 'Enabled' : 'Disabled'}`,
        integrations.embeddings.last_index_at
          ? `Last indexed: ${formatRelativeTime(integrations.embeddings.last_index_at)}`
          : 'No embeddings indexed yet',
        `Retrieval test: ${retrievalTestStr} (threshold: ${rt.threshold})`,
      ],
    },
    {
      title: 'Sync Runs (Inngest)',
      description: 'Orchestration pipeline for incremental Gmail and Calendar sync.',
      status: integrations.inngest.status,
      evidencePointer: 'inngest',
      screenshotPath: '/demo-assets/screens/step-3-inngest-runs.png',
      details: [
        `Environment: ${integrations.inngest.env}`,
        `${integrations.inngest.last_run_ids.length} recent workflow runs`,
        `${integrations.inngest.recent_failures} recent failures`,
        integrations.inngest.last_success_at
          ? `Last success: ${formatRelativeTime(integrations.inngest.last_success_at)}`
          : 'No successful runs observed yet',
      ],
    },
    {
      title: 'Nightfall DLP Enforcement',
      description: 'Every document scanned before indexing: allow, redact, or quarantine.',
      status: integrations.nightfall.status,
      evidencePointer: 'nightfall',
      screenshotPath: '/demo-assets/screens/step-4-nightfall-dlp.png',
      details: [
        `Policy: ${integrations.nightfall.policy_name}`,
        `${integrations.nightfall.last_scan_counts.allowed} documents allowed`,
        `${integrations.nightfall.last_scan_counts.redacted} documents redacted`,
        `${integrations.nightfall.last_scan_counts.quarantined} documents quarantined`,
        integrations.nightfall.last_scan_at
          ? `Last scan: ${formatRelativeTime(integrations.nightfall.last_scan_at)}`
          : 'No scans observed yet',
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
