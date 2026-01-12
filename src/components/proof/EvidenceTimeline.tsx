'use client';

import { EvidenceBundle, IntegrationStatus } from '@/lib/evidence/types';
import { formatTimestamp, getStatusColor, getStatusIcon, getStatusLabel } from '@/lib/evidence/format';

interface TimelineEvent {
  timestamp: string;
  label: string;
  description: string;
  status?: IntegrationStatus;
}

interface EvidenceTimelineProps {
  evidence: EvidenceBundle;
}

export function EvidenceTimeline({ evidence }: EvidenceTimelineProps) {
  // Collect all timestamps into events
  const events: TimelineEvent[] = [];

  // Get retrieval test info
  const rt = evidence.integrations.embeddings.retrieval_test;
  const retrievalStr = rt.query_count > 0
    ? `${rt.success_count}/${rt.query_count}`
    : '0/0';

  // Add integration check events
  events.push({
    timestamp: evidence.integrations.supabase.checked_at,
    label: 'Supabase Check',
    description: `Database verified: ${evidence.integrations.supabase.document_count} docs, ${evidence.integrations.supabase.vector_count} vectors`,
    status: evidence.integrations.supabase.status,
  });

  events.push({
    timestamp: evidence.integrations.inngest.checked_at,
    label: 'Inngest Check',
    description: `Workflow orchestration: ${evidence.integrations.inngest.last_run_ids.length} recent runs`,
    status: evidence.integrations.inngest.status,
  });

  events.push({
    timestamp: evidence.integrations.nightfall.checked_at,
    label: 'Nightfall DLP Check',
    description: `Policy: ${evidence.integrations.nightfall.policy_name}`,
    status: evidence.integrations.nightfall.status,
  });

  events.push({
    timestamp: evidence.integrations.google_oauth.checked_at,
    label: 'Google OAuth Check',
    description: `${evidence.integrations.google_oauth.scopes.length} scopes configured`,
    status: evidence.integrations.google_oauth.status,
  });

  events.push({
    timestamp: evidence.integrations.embeddings.checked_at,
    label: 'Embeddings Check',
    description: `${evidence.integrations.embeddings.vector_count} vectors, retrieval test: ${retrievalStr}`,
    status: evidence.integrations.embeddings.status,
  });

  // Add evidence generation event
  events.push({
    timestamp: evidence.generated_at,
    label: 'Evidence Generated',
    description: `Bundle created by ${evidence.builder}`,
  });

  // Add deploy event
  events.push({
    timestamp: evidence.deploy.completed_at,
    label: 'Deploy Completed',
    description: `Deployed to ${evidence.deploy.url}`,
  });

  // Sort by timestamp (newest first)
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  /**
   * Get timeline dot style based on status
   */
  function getDotStyle(status?: IntegrationStatus): string {
    if (!status) {
      return 'bg-blue-100 text-blue-600';
    }
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-600';
      case 'processing':
      case 'connected':
        return 'bg-blue-100 text-blue-600';
      case 'configured':
        return 'bg-gray-100 text-gray-500';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-600';
      case 'error':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

      <div className="space-y-6">
        {events.map((event, index) => (
          <div key={index} className="relative flex gap-4">
            {/* Timeline dot */}
            <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${getDotStyle(event.status)}`}>
              {event.status ? getStatusIcon(event.status) : '●'}
            </div>

            {/* Content */}
            <div className="flex-1 bg-white rounded-lg border p-4 shadow-sm">
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-medium text-gray-900">{event.label}</h4>
                {event.status && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(event.status)}`}>
                    {getStatusLabel(event.status)}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">{event.description}</p>
              <time className="text-xs text-gray-400 font-mono">
                {formatTimestamp(event.timestamp)}
              </time>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
