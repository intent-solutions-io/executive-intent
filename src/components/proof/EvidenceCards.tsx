'use client';

import { EvidenceBundle, IntegrationStatus, StatusRationale } from '@/lib/evidence/types';
import {
  formatRelativeTime,
  getStatusColor,
  getStatusIcon,
  getStatusLabel,
  formatNumber,
  formatRationale,
} from '@/lib/evidence/format';

interface ProofCardProps {
  title: string;
  status: IntegrationStatus;
  rationale: StatusRationale;
  details: { label: string; value: string | number }[];
  checkedAt: string;
}

function ProofCard({ title, status, rationale, details, checkedAt }: ProofCardProps) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
      {/* Header - stacks on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
        <h3 className="font-semibold text-neutral-900">{title}</h3>
        <span className={`px-2 py-1 rounded text-sm font-medium self-start whitespace-nowrap ${getStatusColor(status)}`}>
          {getStatusIcon(status)} {getStatusLabel(status)}
        </span>
      </div>

      <p className="text-sm text-neutral-500 mb-4 italic">{formatRationale(rationale)}</p>

      {/* Details - label above value on mobile */}
      <dl className="space-y-3">
        {details.map(({ label, value }) => (
          <div key={label} className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-4 text-sm">
            <dt className="text-neutral-500">{label}</dt>
            <dd className="text-neutral-900 font-mono break-all sm:text-right">
              {typeof value === 'number' ? formatNumber(value) : value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 pt-4 border-t border-neutral-100">
        <p className="text-xs text-neutral-500">
          Checked {formatRelativeTime(checkedAt)}
        </p>
      </div>
    </div>
  );
}

interface PipelineHealthCardProps {
  evidence: EvidenceBundle;
}

function PipelineHealthCard({ evidence }: PipelineHealthCardProps) {
  const ph = evidence.pipeline_health;

  return (
    <div className="bg-white rounded-xl border-2 border-neutral-300 p-4 sm:p-6 hover:shadow-md transition-shadow">
      {/* Header - stacks on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-lg text-neutral-900">Pipeline Health</h3>
          <p className="text-sm text-neutral-500">End-to-end processing status</p>
        </div>
        <span className={`px-3 py-1.5 rounded text-sm font-bold self-start whitespace-nowrap ${getStatusColor(ph.status)}`}>
          {getStatusIcon(ph.status)} {getStatusLabel(ph.status)}
        </span>
      </div>

      <p className="text-sm text-neutral-600 mb-4">{formatRationale(ph.rationale)}</p>

      {/* Metrics grid - 1 col on mobile, 3 on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
        <div className="bg-neutral-50 rounded-lg p-3">
          <dt className="text-xs text-neutral-500 uppercase tracking-wider">Documents</dt>
          <dd className="text-xl sm:text-2xl font-bold text-neutral-900">{formatNumber(ph.documents_total)}</dd>
        </div>
        <div className="bg-neutral-50 rounded-lg p-3">
          <dt className="text-xs text-neutral-500 uppercase tracking-wider">Fully Processed</dt>
          <dd className="text-xl sm:text-2xl font-bold text-neutral-900">{formatNumber(ph.fully_processed)}</dd>
        </div>
        <div className="bg-neutral-50 rounded-lg p-3">
          <dt className="text-xs text-neutral-500 uppercase tracking-wider">Processing Rate</dt>
          <dd className="text-xl sm:text-2xl font-bold text-neutral-900">{ph.processing_rate}</dd>
        </div>
      </div>

      <div className="border-t border-neutral-100 pt-4">
        <h4 className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Subsystem Status</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ph.subsystem_statuses).map(([name, status]) => (
            <span
              key={name}
              className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(status)}`}
            >
              {getStatusIcon(status)} {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

interface EvidenceCardsProps {
  evidence: EvidenceBundle;
}

export function EvidenceCards({ evidence }: EvidenceCardsProps) {
  const { integrations } = evidence;

  const rt = integrations.embeddings.retrieval_test;
  const retrievalTestStr = rt.query_count > 0
    ? `${rt.success_count}/${rt.query_count} ${rt.passed ? '(PASS)' : '(FAIL)'}`
    : 'Not run';

  return (
    <div className="space-y-6">
      {/* Pipeline Health Card - always full width */}
      <PipelineHealthCard evidence={evidence} />

      {/* Integration cards grid
          - <640px (mobile): 1 column
          - 640-1024px (tablet): 2 columns
          - >=1024px (desktop): 3 columns
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <ProofCard
          title="Supabase"
          status={integrations.supabase.status}
          rationale={integrations.supabase.rationale}
          details={[
            { label: 'Project', value: integrations.supabase.project_ref },
            { label: 'Schema', value: integrations.supabase.schema_version },
            { label: 'pgvector', value: integrations.supabase.pgvector ? 'Enabled' : 'Disabled' },
            { label: 'RLS', value: integrations.supabase.rls_verified ? 'Verified' : 'Not Verified' },
            { label: 'Documents', value: integrations.supabase.document_count },
            { label: 'Chunks', value: integrations.supabase.chunk_count },
            { label: 'Vectors', value: integrations.supabase.vector_count },
          ]}
          checkedAt={integrations.supabase.checked_at}
        />

        <ProofCard
          title="Inngest"
          status={integrations.inngest.status}
          rationale={integrations.inngest.rationale}
          details={[
            { label: 'Environment', value: integrations.inngest.env },
            { label: 'Recent Runs', value: integrations.inngest.last_run_ids.length },
            { label: 'Recent Failures', value: integrations.inngest.recent_failures },
            { label: 'Last Success', value: integrations.inngest.last_success_at ? formatRelativeTime(integrations.inngest.last_success_at) : 'Never' },
          ]}
          checkedAt={integrations.inngest.checked_at}
        />

        <ProofCard
          title="Nightfall DLP"
          status={integrations.nightfall.status}
          rationale={integrations.nightfall.rationale}
          details={[
            { label: 'Policy', value: integrations.nightfall.policy_name },
            { label: 'Allowed', value: integrations.nightfall.last_scan_counts.allowed },
            { label: 'Redacted', value: integrations.nightfall.last_scan_counts.redacted },
            { label: 'Quarantined', value: integrations.nightfall.last_scan_counts.quarantined },
            { label: 'Last Scan', value: integrations.nightfall.last_scan_at ? formatRelativeTime(integrations.nightfall.last_scan_at) : 'Never' },
          ]}
          checkedAt={integrations.nightfall.checked_at}
        />

        <ProofCard
          title="Google OAuth"
          status={integrations.google_oauth.status}
          rationale={integrations.google_oauth.rationale}
          details={[
            { label: 'Token Valid', value: integrations.google_oauth.token_valid ? 'Yes' : 'No' },
            { label: 'Scopes', value: `${integrations.google_oauth.scopes.length} configured` },
            { label: 'Last Connect', value: integrations.google_oauth.last_connect_at ? formatRelativeTime(integrations.google_oauth.last_connect_at) : 'Never' },
          ]}
          checkedAt={integrations.google_oauth.checked_at}
        />

        <ProofCard
          title="Embeddings"
          status={integrations.embeddings.status}
          rationale={integrations.embeddings.rationale}
          details={[
            { label: 'Vector Count', value: integrations.embeddings.vector_count },
            { label: 'Last Index', value: integrations.embeddings.last_index_at ? formatRelativeTime(integrations.embeddings.last_index_at) : 'Never' },
            { label: 'Retrieval Test', value: retrievalTestStr },
            { label: 'Threshold', value: `${rt.threshold}/${rt.query_count}` },
          ]}
          checkedAt={integrations.embeddings.checked_at}
        />
      </div>
    </div>
  );
}
