// Evidence Bundle Types for Executive Intent Proof System

// =============================================================================
// STATUS TAXONOMY - Single source of truth for all integration statuses
// =============================================================================

/**
 * Integration status reflecting actual proof state, not just configuration.
 * Ordered from least to most verified - use StageOrder for comparisons.
 */
export type IntegrationStatus =
  | 'error'       // Hard failure: missing required config, auth invalid, API unreachable
  | 'configured'  // Env/scopes set; no user connection proven
  | 'connected'   // OAuth token exists and a real API call succeeds
  | 'processing'  // Ingest/jobs running; counts changing / recent runs exist
  | 'verified'    // Meets defined thresholds; end-to-end actually working
  | 'degraded';   // Partial failure or inconsistent signals

/**
 * Numeric order for status comparison (higher = better)
 * Used for computing minimum stage in pipeline_health rollup
 */
export const StageOrder: Record<IntegrationStatus, number> = {
  error: 0,
  configured: 1,
  connected: 2,
  processing: 3,
  verified: 4,
  degraded: -1,  // Special: treated as "below current stage" in rollups
};

/**
 * Get minimum status from an array (for rollup calculations)
 */
export function getMinimumStatus(statuses: IntegrationStatus[]): IntegrationStatus {
  // If any is error, return error
  if (statuses.includes('error')) return 'error';
  // If any is degraded, return degraded
  if (statuses.includes('degraded')) return 'degraded';

  // Otherwise find minimum positive stage
  const positiveStatuses = statuses.filter(s => StageOrder[s] > 0);
  if (positiveStatuses.length === 0) return 'configured';

  return positiveStatuses.reduce((min, current) =>
    StageOrder[current] < StageOrder[min] ? current : min
  );
}

/**
 * Reason codes for status rationale - standardized across integrations
 */
export type ReasonCode =
  // Configuration issues
  | 'MISSING_CREDENTIALS'
  | 'MISSING_ENV_VAR'
  | 'INVALID_CONFIG'
  // Connection issues
  | 'API_UNREACHABLE'
  | 'AUTH_FAILED'
  | 'TOKEN_EXPIRED'
  | 'NO_TOKEN'
  // Data issues
  | 'NO_DATA_OBSERVED'
  | 'DOC_CHUNK_MISMATCH'
  | 'DOC_VECTOR_MISMATCH'
  | 'ZERO_SCANS'
  | 'RETRIEVAL_BELOW_THRESHOLD'
  // Processing issues
  | 'JOBS_FAILING'
  | 'QUEUE_BACKED_UP'
  | 'STALE_DATA'
  // Success indicators
  | 'ALL_CHECKS_PASSED'
  | 'THRESHOLD_MET'
  | 'DATA_FLOWING';

/**
 * Status rationale explaining WHY a status was assigned
 */
export interface StatusRationale {
  reason_codes: ReasonCode[];
  details?: Record<string, unknown>;
}

// =============================================================================
// COMMON TYPES
// =============================================================================

export interface CommitInfo {
  hash: string;
  branch: string;
}

export interface CIInfo {
  provider: string;
  workflow: string;
  run_id: string;
  run_url: string;
}

export interface DeployInfo {
  target: string;
  firebase_project: string;
  site: string;
  channel: string;
  url: string;
  completed_at: string;
}

// =============================================================================
// INTEGRATION TYPES
// =============================================================================

export interface SupabaseIntegration {
  status: IntegrationStatus;
  rationale: StatusRationale;
  project_ref: string;
  schema_version: string;
  pgvector: boolean;
  rls_verified: boolean;
  document_count: number;
  chunk_count: number;
  vector_count: number;
  checked_at: string;
}

export interface InngestIntegration {
  status: IntegrationStatus;
  rationale: StatusRationale;
  env: string;
  last_run_ids: string[];
  last_success_at: string | null;
  recent_failures: number;
  checked_at: string;
}

export interface NightfallIntegration {
  status: IntegrationStatus;
  rationale: StatusRationale;
  policy_name: string;
  last_scan_counts: {
    allowed: number;
    redacted: number;
    quarantined: number;
  };
  last_scan_at: string | null;
  checked_at: string;
}

export interface GoogleOAuthIntegration {
  status: IntegrationStatus;
  rationale: StatusRationale;
  scopes: string[];
  last_connect_at: string | null;
  token_valid: boolean;
  checked_at: string;
}

/**
 * Sample retrieval result with provenance
 */
export interface RetrievalSample {
  query: string;
  results: Array<{
    doc_id: string;
    chunk_id: string;
    score: number;
  }>;
}

/**
 * Expanded retrieval test with structured reporting
 */
export interface RetrievalTest {
  query_count: number;
  success_count: number;
  top_k: number;
  threshold: number;        // Minimum success count for VERIFIED (default: 8)
  passed: boolean;          // success_count >= threshold
  failures: {
    no_results: number;
    errors: number;
  };
  samples: RetrievalSample[];  // 1-3 sample queries with results
}

export interface EmbeddingsIntegration {
  status: IntegrationStatus;
  rationale: StatusRationale;
  vector_count: number;
  last_index_at: string | null;
  retrieval_test: RetrievalTest;
  checked_at: string;
}

export interface Integrations {
  supabase: SupabaseIntegration;
  inngest: InngestIntegration;
  nightfall: NightfallIntegration;
  google_oauth: GoogleOAuthIntegration;
  embeddings: EmbeddingsIntegration;
}

// =============================================================================
// PIPELINE HEALTH - Rollup of all integration statuses
// =============================================================================

export interface PipelineHealth {
  status: IntegrationStatus;
  rationale: StatusRationale;
  subsystem_statuses: Record<keyof Integrations, IntegrationStatus>;
  documents_total: number;
  documents_chunked: number;
  documents_embedded: number;
  documents_dlp_scanned: number;
  fully_processed: number;
  processing_rate: string;  // "5/11 (45%)"
}

// =============================================================================
// EVIDENCE BUNDLE
// =============================================================================

export interface Redactions {
  rules_applied: string[];
}

export interface EvidenceBundle {
  product: string;
  generated_at: string;
  builder: string;
  commit: CommitInfo;
  ci: CIInfo;
  deploy: DeployInfo;
  integrations: Integrations;
  pipeline_health: PipelineHealth;
  redactions: Redactions;
  notes: string;
}

// =============================================================================
// TYPE GUARDS & UTILITIES
// =============================================================================

export function isValidEvidence(obj: unknown): obj is EvidenceBundle {
  if (!obj || typeof obj !== 'object') return false;
  const e = obj as Record<string, unknown>;

  return (
    typeof e.product === 'string' &&
    typeof e.generated_at === 'string' &&
    typeof e.builder === 'string' &&
    e.commit !== undefined &&
    e.ci !== undefined &&
    e.deploy !== undefined &&
    e.integrations !== undefined &&
    e.pipeline_health !== undefined
  );
}

/**
 * Criteria for what makes each integration "verified"
 * Used for UI display and documentation
 */
export const VerificationCriteria: Record<keyof Integrations, string[]> = {
  google_oauth: [
    'OAuth credentials configured',
    'Token exists and is valid',
    'API call succeeds (not 401/403)',
  ],
  supabase: [
    'Database connection works',
    'Tables exist with expected schema',
    'Document/chunk/vector counts reconcile (no mismatch)',
  ],
  inngest: [
    'Event key and signing key configured',
    'Recent successful run exists (within 24h)',
    'No recent failures',
  ],
  nightfall: [
    'API key configured and valid',
    'At least one scan observed (counts > 0)',
    'OR seeded test dataset has been processed',
  ],
  embeddings: [
    'Embedding provider configured',
    'Vector count > 0',
    'Retrieval test passes (≥8/10 queries return results)',
  ],
};
