import type {
  Integrations,
  IntegrationStatus,
  PipelineHealth,
  ReasonCode,
  StatusRationale,
} from './types';
import { getMinimumStatus } from './types';

export interface PipelineHealthStats {
  documents_total: number;
  documents_chunked: number;
  documents_embedded: number;
}

const REQUIRED_SUBSYSTEMS: Array<keyof Integrations> = [
  'google_oauth',
  'inngest',
  'supabase',
  'embeddings',
  'nightfall',
];

function uniqueStable<T>(items: T[]): T[] {
  const seen = new Set<T>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

function buildRollupRationale(
  integrations: Integrations,
  subsystem_statuses: Record<keyof Integrations, IntegrationStatus>,
  overallStatus: IntegrationStatus
): StatusRationale {
  const focus =
    overallStatus === 'error'
      ? REQUIRED_SUBSYSTEMS.filter((k) => subsystem_statuses[k] === 'error')
      : overallStatus === 'degraded'
        ? REQUIRED_SUBSYSTEMS.filter((k) => subsystem_statuses[k] === 'degraded')
        : REQUIRED_SUBSYSTEMS.filter((k) => subsystem_statuses[k] === overallStatus);

  const focusSubsystems = focus.length > 0 ? focus : REQUIRED_SUBSYSTEMS;

  const aggregated = uniqueStable(
    focusSubsystems.flatMap((k) => integrations[k].rationale?.reason_codes || [])
  );

  const subsystem_rationales = Object.fromEntries(
    REQUIRED_SUBSYSTEMS.map((k) => [
      k,
      {
        status: subsystem_statuses[k],
        reason_codes: integrations[k].rationale?.reason_codes || [],
        note:
          typeof integrations[k].rationale?.details?.note === 'string'
            ? integrations[k].rationale.details.note
            : undefined,
      },
    ])
  );

  const details: Record<string, unknown> = {
    focus_subsystems: focusSubsystems,
    subsystem_statuses,
    subsystem_rationales,
  };

  if (overallStatus === 'error') {
    details.note = `Pipeline blocked: ${focusSubsystems.join(', ')} in error`;
  } else if (overallStatus === 'degraded') {
    details.note = `Pipeline degraded: ${focusSubsystems.join(', ')} needs attention`;
  } else if (overallStatus === 'verified') {
    details.note = 'All required subsystems verified.';
  } else if (overallStatus === 'processing') {
    details.note = `Pipeline processing (minimum stage: ${focusSubsystems.join(', ')})`;
  } else if (overallStatus === 'connected' || overallStatus === 'configured') {
    details.note = `Pipeline at ${overallStatus} stage (bottleneck: ${focusSubsystems.join(', ')})`;
  }

  const fallback: ReasonCode[] =
    overallStatus === 'verified'
      ? ['ALL_CHECKS_PASSED', 'DATA_FLOWING']
      : overallStatus === 'processing'
        ? ['DATA_FLOWING']
        : overallStatus === 'connected' || overallStatus === 'configured'
          ? ['NO_DATA_OBSERVED_YET']
          : overallStatus === 'degraded'
            ? ['JOBS_FAILING']
            : ['API_UNREACHABLE'];

  return {
    reason_codes: (aggregated.length > 0 ? aggregated : fallback).slice(0, 6),
    details,
  };
}

/**
 * Pipeline health rollup for the Evidence Bundle.
 *
 * Rules:
 * - If any required subsystem is `error` => pipeline_health = `error`
 * - Else if any required subsystem is `degraded` => pipeline_health = `degraded`
 * - Else pipeline_health = minimum stage among {configured, connected, processing, verified}
 *
 * The rollup rationale aggregates top reason codes from the subsystem(s)
 * responsible for the overall status.
 */
export function computePipelineHealth(
  integrations: Integrations,
  stats?: Partial<PipelineHealthStats>
): PipelineHealth {
  const subsystem_statuses: Record<keyof Integrations, IntegrationStatus> = {
    supabase: integrations.supabase.status,
    inngest: integrations.inngest.status,
    nightfall: integrations.nightfall.status,
    google_oauth: integrations.google_oauth.status,
    embeddings: integrations.embeddings.status,
  };

  const overallStatus = getMinimumStatus(Object.values(subsystem_statuses));

  const documents_total = stats?.documents_total ?? integrations.supabase.document_count;
  const documents_chunked =
    stats?.documents_chunked ?? Math.min(documents_total, integrations.supabase.chunk_count);
  const documents_embedded =
    stats?.documents_embedded ?? Math.min(documents_total, integrations.embeddings.vector_count);
  const documents_dlp_scanned =
    integrations.nightfall.last_scan_counts.allowed +
    integrations.nightfall.last_scan_counts.redacted +
    integrations.nightfall.last_scan_counts.quarantined;

  const fully_processed = Math.min(documents_chunked, documents_embedded, documents_dlp_scanned);
  const processing_rate =
    documents_total > 0
      ? `${fully_processed}/${documents_total} (${Math.round((fully_processed / documents_total) * 100)}%)`
      : '0/0 (0%)';

  return {
    status: overallStatus,
    rationale: buildRollupRationale(integrations, subsystem_statuses, overallStatus),
    subsystem_statuses,
    documents_total,
    documents_chunked,
    documents_embedded,
    documents_dlp_scanned,
    fully_processed,
    processing_rate,
  };
}

