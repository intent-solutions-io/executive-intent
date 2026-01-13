import {
  EvidenceBundle,
  IntegrationStatus,
  Integrations,
  PipelineHealth,
  ReasonCode,
  StatusRationale,
  getMinimumStatus,
} from './types';

type AnyRecord = Record<string, unknown>;

function isRecord(value: unknown): value is AnyRecord {
  return Boolean(value) && typeof value === 'object';
}

function normalizeStatus(value: unknown): IntegrationStatus {
  if (value === 'error' || value === 'configured' || value === 'connected' || value === 'processing' || value === 'verified' || value === 'degraded') {
    return value;
  }
  if (typeof value !== 'string') return 'configured';

  const s = value.trim().toLowerCase();
  if (['ok', 'pass', 'passed', 'success', 'healthy'].includes(s)) return 'verified';
  if (['warn', 'warning', 'degraded', 'partial'].includes(s)) return 'degraded';
  if (['error', 'fail', 'failed', 'broken'].includes(s)) return 'error';
  if (s === 'connected') return 'connected';
  if (s === 'processing') return 'processing';
  if (s === 'configured') return 'configured';
  return 'configured';
}

function rationale(reason_codes: ReasonCode[], details?: Record<string, unknown>): StatusRationale {
  return { reason_codes, details };
}

function defaultRationaleFor(status: IntegrationStatus, details?: Record<string, unknown>): StatusRationale {
  switch (status) {
    case 'verified':
      return rationale(['ALL_CHECKS_PASSED'], details);
    case 'processing':
      return rationale(['DATA_FLOWING'], details);
    case 'connected':
      return rationale(['DATA_FLOWING'], details);
    case 'degraded':
      return rationale(['JOBS_FAILING'], details);
    case 'error':
      return rationale(['API_UNREACHABLE'], details);
    case 'configured':
    default:
      return rationale(['NO_DATA_OBSERVED'], details);
  }
}

function coerceString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function coerceNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function coerceBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function coerceStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

function buildPipelineHealth(integrations: Integrations): PipelineHealth {
  const subsystem_statuses: Record<keyof Integrations, IntegrationStatus> = {
    supabase: integrations.supabase.status,
    inngest: integrations.inngest.status,
    nightfall: integrations.nightfall.status,
    google_oauth: integrations.google_oauth.status,
    embeddings: integrations.embeddings.status,
  };

  const documents_total = integrations.supabase.document_count;
  const documents_chunked = Math.min(documents_total, integrations.supabase.chunk_count);
  const documents_embedded = Math.min(documents_total, integrations.embeddings.vector_count);
  const documents_dlp_scanned =
    integrations.nightfall.last_scan_counts.allowed +
    integrations.nightfall.last_scan_counts.redacted +
    integrations.nightfall.last_scan_counts.quarantined;

  const fully_processed = Math.min(documents_chunked, documents_embedded, documents_dlp_scanned);
  const processing_rate =
    documents_total > 0
      ? `${fully_processed}/${documents_total} (${Math.round((fully_processed / documents_total) * 100)}%)`
      : '0/0 (0%)';

  const overall = getMinimumStatus(Object.values(subsystem_statuses));

  let reason_codes: ReasonCode[] = [];
  const details: Record<string, unknown> = { subsystem_statuses };

  if (overall === 'verified') {
    reason_codes = ['ALL_CHECKS_PASSED', 'DATA_FLOWING'];
    details.note = 'All subsystems verified.';
  } else if (overall === 'processing') {
    reason_codes = ['DATA_FLOWING'];
    details.note = 'Pipeline is actively processing.';
  } else if (overall === 'connected' || overall === 'configured') {
    reason_codes = ['NO_DATA_OBSERVED'];
    details.note = 'Configured/connected but not yet meeting verification thresholds.';
  } else if (overall === 'degraded') {
    reason_codes = integrations.embeddings.status === 'degraded'
      ? ['RETRIEVAL_BELOW_THRESHOLD']
      : ['JOBS_FAILING'];
    details.note = 'One or more subsystems degraded.';
  } else if (overall === 'error') {
    reason_codes = ['API_UNREACHABLE'];
    details.note = 'One or more subsystems in error state.';
  }

  return {
    status: overall,
    rationale: rationale(reason_codes, details),
    subsystem_statuses,
    documents_total,
    documents_chunked,
    documents_embedded,
    documents_dlp_scanned,
    fully_processed,
    processing_rate,
  };
}

/**
 * Normalize evidence to the current EvidenceBundle shape.
 * Supports:
 * - Current schema (pipeline_health present)
 * - Legacy schema (no pipeline_health, statuses like "OK")
 */
export function normalizeEvidence(input: unknown): EvidenceBundle | null {
  if (!isRecord(input)) return null;
  const e = input as AnyRecord;

  const hasCoreFields =
    typeof e.product === 'string' &&
    typeof e.generated_at === 'string' &&
    typeof e.builder === 'string' &&
    isRecord(e.commit) &&
    isRecord(e.ci) &&
    isRecord(e.deploy) &&
    isRecord(e.integrations);

  if (!hasCoreFields) return null;

  const commit = e.commit as AnyRecord;
  const ci = e.ci as AnyRecord;
  const deploy = e.deploy as AnyRecord;
  const rawIntegrations = e.integrations as AnyRecord;

  // If pipeline_health exists, assume current schema and just ensure required subfields exist.
  if (isRecord(e.pipeline_health)) {
    const current = e as unknown as EvidenceBundle;
    return {
      ...current,
      notes: typeof current.notes === 'string' ? current.notes : '',
    };
  }

  // Legacy schema: coerce integrations into current shape.
  const supabase = isRecord(rawIntegrations.supabase) ? (rawIntegrations.supabase as AnyRecord) : {};
  const inngest = isRecord(rawIntegrations.inngest) ? (rawIntegrations.inngest as AnyRecord) : {};
  const nightfall = isRecord(rawIntegrations.nightfall) ? (rawIntegrations.nightfall as AnyRecord) : {};
  const google_oauth = isRecord(rawIntegrations.google_oauth) ? (rawIntegrations.google_oauth as AnyRecord) : {};
  const embeddings = isRecord(rawIntegrations.embeddings) ? (rawIntegrations.embeddings as AnyRecord) : {};

  const legacySupabaseStatus = normalizeStatus(supabase.status);
  const legacyInngestStatus = normalizeStatus(inngest.status);
  const legacyNightfallStatus = normalizeStatus(nightfall.status);
  const legacyOAuthStatus = normalizeStatus(google_oauth.status);
  const legacyEmbeddingsStatus = normalizeStatus(embeddings.status);

  const legacyRetrieval = isRecord(embeddings.retrieval_test) ? (embeddings.retrieval_test as AnyRecord) : {};
  const top_k = coerceNumber(legacyRetrieval.top_k, 10);
  const threshold = coerceNumber(legacyRetrieval.threshold, 8);
  const query_count = coerceNumber(legacyRetrieval.query_count, typeof legacyRetrieval.returned === 'number' ? 10 : 0);
  const success_count = coerceNumber(legacyRetrieval.success_count, coerceNumber(legacyRetrieval.returned, 0));
  const passed = query_count > 0 ? success_count >= threshold : false;

  const retrieval_test = {
    query_count,
    success_count,
    top_k,
    threshold,
    passed,
    failures: {
      no_results: query_count > 0 ? Math.max(0, query_count - success_count) : 0,
      errors: 0,
    },
    samples: [],
  };

  // If retrieval ran and is below threshold, reflect it as degraded (proof-first, no greenwashing).
  const embeddingsStatus =
    query_count > 0 && !passed && coerceNumber(embeddings.vector_count, 0) > 0
      ? 'degraded'
      : legacyEmbeddingsStatus;

  const integrations: Integrations = {
    supabase: {
      status: legacySupabaseStatus,
      rationale: defaultRationaleFor(legacySupabaseStatus),
      project_ref: coerceString(supabase.project_ref),
      schema_version: coerceString(supabase.schema_version),
      pgvector: coerceBoolean(supabase.pgvector),
      rls_verified: coerceBoolean(supabase.rls_verified),
      document_count: coerceNumber(supabase.document_count),
      chunk_count: coerceNumber(supabase.chunk_count),
      vector_count: coerceNumber(supabase.vector_count),
      checked_at: coerceString(supabase.checked_at, coerceString(e.generated_at)),
    },
    inngest: {
      status: legacyInngestStatus,
      rationale: defaultRationaleFor(legacyInngestStatus),
      env: coerceString(inngest.env),
      last_run_ids: coerceStringArray(inngest.last_run_ids),
      last_success_at: typeof inngest.last_success_at === 'string' ? inngest.last_success_at : null,
      recent_failures: coerceNumber(inngest.recent_failures, 0),
      checked_at: coerceString(inngest.checked_at, coerceString(e.generated_at)),
    },
    nightfall: {
      status: legacyNightfallStatus,
      rationale: defaultRationaleFor(legacyNightfallStatus),
      policy_name: coerceString(nightfall.policy_name),
      last_scan_counts: {
        allowed: coerceNumber((nightfall.last_scan_counts as AnyRecord | undefined)?.allowed),
        redacted: coerceNumber((nightfall.last_scan_counts as AnyRecord | undefined)?.redacted),
        quarantined: coerceNumber((nightfall.last_scan_counts as AnyRecord | undefined)?.quarantined),
      },
      last_scan_at: typeof nightfall.last_scan_at === 'string' ? nightfall.last_scan_at : null,
      checked_at: coerceString(nightfall.checked_at, coerceString(e.generated_at)),
    },
    google_oauth: {
      status: legacyOAuthStatus,
      rationale: defaultRationaleFor(legacyOAuthStatus),
      scopes: coerceStringArray(google_oauth.scopes),
      last_connect_at: typeof google_oauth.last_connect_at === 'string' ? google_oauth.last_connect_at : null,
      token_valid: coerceBoolean(google_oauth.token_valid, legacyOAuthStatus !== 'configured' && legacyOAuthStatus !== 'error'),
      checked_at: coerceString(google_oauth.checked_at, coerceString(e.generated_at)),
    },
    embeddings: {
      status: embeddingsStatus,
      rationale: embeddingsStatus === 'degraded'
        ? rationale(['RETRIEVAL_BELOW_THRESHOLD'], { note: 'Legacy evidence indicates retrieval below threshold.' })
        : defaultRationaleFor(legacyEmbeddingsStatus),
      vector_count: coerceNumber(embeddings.vector_count),
      last_index_at: typeof embeddings.last_index_at === 'string' ? embeddings.last_index_at : null,
      retrieval_test,
      checked_at: coerceString(embeddings.checked_at, coerceString(e.generated_at)),
    },
  };

  const pipeline_health = buildPipelineHealth(integrations);

  return {
    product: coerceString(e.product),
    generated_at: coerceString(e.generated_at),
    builder: coerceString(e.builder),
    commit: {
      hash: coerceString(commit.hash),
      branch: coerceString(commit.branch),
    },
    ci: {
      provider: coerceString(ci.provider),
      workflow: coerceString(ci.workflow),
      run_id: coerceString(ci.run_id),
      run_url: coerceString(ci.run_url),
    },
    deploy: {
      target: coerceString(deploy.target),
      firebase_project: coerceString(deploy.firebase_project),
      site: coerceString(deploy.site),
      channel: coerceString(deploy.channel),
      url: coerceString(deploy.url),
      completed_at: coerceString(deploy.completed_at, coerceString(e.generated_at)),
    },
    integrations,
    pipeline_health,
    redactions: {
      rules_applied: coerceStringArray((e.redactions as AnyRecord | undefined)?.rules_applied),
    },
    notes: coerceString(e.notes),
  };
}

