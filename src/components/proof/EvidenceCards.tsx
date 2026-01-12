'use client';

import { EvidenceBundle, IntegrationStatus } from '@/lib/evidence/types';
import { formatRelativeTime, getStatusColor, getStatusIcon, formatNumber } from '@/lib/evidence/format';

interface ProofCardProps {
  title: string;
  status: IntegrationStatus;
  reason?: string;
  details: { label: string; value: string | number }[];
  checkedAt: string;
}

function ProofCard({ title, status, reason, details, checkedAt }: ProofCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(status)}`}>
          {getStatusIcon(status)} {status}
        </span>
      </div>

      {reason && (
        <p className="text-sm text-gray-500 mb-4 italic">{reason}</p>
      )}

      <dl className="space-y-2">
        {details.map(({ label, value }) => (
          <div key={label} className="flex justify-between text-sm">
            <dt className="text-gray-500">{label}</dt>
            <dd className="text-gray-900 font-mono">{typeof value === 'number' ? formatNumber(value) : value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Verified {formatRelativeTime(checkedAt)}
        </p>
      </div>
    </div>
  );
}

interface EvidenceCardsProps {
  evidence: EvidenceBundle;
}

export function EvidenceCards({ evidence }: EvidenceCardsProps) {
  const { integrations } = evidence;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ProofCard
        title="Supabase"
        status={integrations.supabase.status}
        reason={integrations.supabase.reason}
        details={[
          { label: 'Project', value: integrations.supabase.project_ref },
          { label: 'Schema Version', value: integrations.supabase.schema_version },
          { label: 'pgvector', value: integrations.supabase.pgvector ? 'Enabled' : 'Disabled' },
          { label: 'RLS', value: integrations.supabase.rls_verified ? 'Verified' : 'Not Verified' },
          { label: 'Documents', value: integrations.supabase.document_count },
          { label: 'Vectors', value: integrations.supabase.vector_count },
        ]}
        checkedAt={integrations.supabase.checked_at}
      />

      <ProofCard
        title="Inngest"
        status={integrations.inngest.status}
        reason={integrations.inngest.reason}
        details={[
          { label: 'Environment', value: integrations.inngest.env },
          { label: 'Recent Runs', value: integrations.inngest.last_run_ids.length },
          { label: 'Last Success', value: integrations.inngest.last_success_at ? formatRelativeTime(integrations.inngest.last_success_at) : 'Never' },
        ]}
        checkedAt={integrations.inngest.checked_at}
      />

      <ProofCard
        title="Nightfall DLP"
        status={integrations.nightfall.status}
        reason={integrations.nightfall.reason}
        details={[
          { label: 'Policy', value: integrations.nightfall.policy_name },
          { label: 'Allowed', value: integrations.nightfall.last_scan_counts.allowed },
          { label: 'Redacted', value: integrations.nightfall.last_scan_counts.redacted },
          { label: 'Quarantined', value: integrations.nightfall.last_scan_counts.quarantined },
        ]}
        checkedAt={integrations.nightfall.checked_at}
      />

      <ProofCard
        title="Google OAuth"
        status={integrations.google_oauth.status}
        reason={integrations.google_oauth.reason}
        details={[
          { label: 'Scopes', value: `${integrations.google_oauth.scopes.length} configured` },
          { label: 'Last Connect', value: integrations.google_oauth.last_connect_at ? formatRelativeTime(integrations.google_oauth.last_connect_at) : 'Never' },
        ]}
        checkedAt={integrations.google_oauth.checked_at}
      />

      <ProofCard
        title="Embeddings"
        status={integrations.embeddings.status}
        reason={integrations.embeddings.reason}
        details={[
          { label: 'Vector Count', value: integrations.embeddings.vector_count },
          { label: 'Last Index', value: integrations.embeddings.last_index_at ? formatRelativeTime(integrations.embeddings.last_index_at) : 'Never' },
          { label: 'Retrieval Test', value: `${integrations.embeddings.retrieval_test.returned}/${integrations.embeddings.retrieval_test.top_k}` },
        ]}
        checkedAt={integrations.embeddings.checked_at}
      />
    </div>
  );
}
