// Evidence Bundle Types for Executive Intent Proof System

export type IntegrationStatus = 'OK' | 'DEGRADED' | 'BLOCKED';

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

export interface SupabaseIntegration {
  status: IntegrationStatus;
  reason?: string;
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
  reason?: string;
  env: string;
  last_run_ids: string[];
  last_success_at: string | null;
  checked_at: string;
}

export interface NightfallIntegration {
  status: IntegrationStatus;
  reason?: string;
  policy_name: string;
  last_scan_counts: {
    allowed: number;
    redacted: number;
    quarantined: number;
  };
  checked_at: string;
}

export interface GoogleOAuthIntegration {
  status: IntegrationStatus;
  reason?: string;
  scopes: string[];
  last_connect_at: string | null;
  checked_at: string;
}

export interface EmbeddingsIntegration {
  status: IntegrationStatus;
  reason?: string;
  vector_count: number;
  last_index_at: string | null;
  retrieval_test: {
    top_k: number;
    returned: number;
  };
  checked_at: string;
}

export interface Integrations {
  supabase: SupabaseIntegration;
  inngest: InngestIntegration;
  nightfall: NightfallIntegration;
  google_oauth: GoogleOAuthIntegration;
  embeddings: EmbeddingsIntegration;
}

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
  redactions: Redactions;
  notes: string;
}

// Type guard to check if evidence is valid
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
    e.integrations !== undefined
  );
}
