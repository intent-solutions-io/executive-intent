import { computePipelineHealth } from "@/lib/evidence/pipelineHealth";
import type {
  EmbeddingsIntegration,
  GoogleOAuthIntegration,
  InngestIntegration,
  Integrations,
  NightfallIntegration,
  ReasonCode,
  SupabaseIntegration,
} from "@/lib/evidence/types";

function r(reason_codes: ReasonCode[], note?: string) {
  return { reason_codes, details: note ? { note } : undefined };
}

function makeIntegrations(overrides: Partial<Integrations> = {}): Integrations {
  const checked_at = "2026-01-01T00:00:00.000Z";

  const supabase: SupabaseIntegration = {
    status: "verified",
    rationale: r(["ALL_CHECKS_PASSED"]),
    project_ref: "test",
    schema_version: "003",
    pgvector: true,
    rls_verified: true,
    document_count: 10,
    chunk_count: 100,
    vector_count: 100,
    checked_at,
  };

  const inngest: InngestIntegration = {
    status: "verified",
    rationale: r(["ALL_CHECKS_PASSED"]),
    env: "production",
    last_run_ids: ["run-1"],
    last_success_at: checked_at,
    recent_failures: 0,
    checked_at,
  };

  const nightfall: NightfallIntegration = {
    status: "verified",
    rationale: r(["ALL_CHECKS_PASSED"]),
    policy_name: "executive-intent-dlp",
    last_scan_counts: { allowed: 3, redacted: 1, quarantined: 0 },
    last_scan_at: checked_at,
    checked_at,
  };

  const google_oauth: GoogleOAuthIntegration = {
    status: "verified",
    rationale: r(["ALL_CHECKS_PASSED"]),
    scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
    last_connect_at: checked_at,
    token_valid: true,
    checked_at,
  };

  const embeddings: EmbeddingsIntegration = {
    status: "verified",
    rationale: r(["THRESHOLD_MET", "DATA_FLOWING"]),
    vector_count: 100,
    last_index_at: checked_at,
    retrieval_test: {
      query_count: 10,
      success_count: 10,
      top_k: 10,
      threshold: 8,
      passed: true,
      failures: { no_results: 0, errors: 0 },
      samples: [
        {
          query: "executive summary",
          results: [{ doc_id: "doc-1", chunk_id: "chunk-1", score: 0.9 }],
        },
      ],
    },
    checked_at,
  };

  return {
    supabase,
    inngest,
    nightfall,
    google_oauth,
    embeddings,
    ...overrides,
  };
}

describe("computePipelineHealth", () => {
  it("rolls up to error if any subsystem is error", () => {
    const integrations = makeIntegrations({
      google_oauth: {
        ...makeIntegrations().google_oauth,
        status: "error",
        rationale: r(["AUTH_FAILED"], "Token rejected"),
        token_valid: false,
      },
    });

    const ph = computePipelineHealth(integrations);
    expect(ph.status).toBe("error");
    expect(ph.rationale.reason_codes).toContain("AUTH_FAILED");
    expect(ph.rationale.details?.focus_subsystems).toContain("google_oauth");
  });

  it("rolls up to degraded if any subsystem is degraded (and none error)", () => {
    const integrations = makeIntegrations({
      embeddings: {
        ...makeIntegrations().embeddings,
        status: "degraded",
        rationale: r(["RETRIEVAL_BELOW_THRESHOLD"], "Only 2/10 queries returned results"),
        retrieval_test: {
          ...makeIntegrations().embeddings.retrieval_test,
          success_count: 2,
          passed: false,
        },
      },
    });

    const ph = computePipelineHealth(integrations);
    expect(ph.status).toBe("degraded");
    expect(ph.rationale.reason_codes).toContain("RETRIEVAL_BELOW_THRESHOLD");
    expect(ph.rationale.details?.focus_subsystems).toContain("embeddings");
  });

  it("rolls up to the minimum stage when no degraded/error", () => {
    const integrations = makeIntegrations({
      google_oauth: {
        ...makeIntegrations().google_oauth,
        status: "configured",
        rationale: r(["NO_TOKEN"], "Awaiting first user connection"),
        last_connect_at: null,
        token_valid: false,
      },
    });

    const ph = computePipelineHealth(integrations);
    expect(ph.status).toBe("configured");
    expect(ph.rationale.reason_codes).toContain("NO_TOKEN");
    expect(ph.rationale.details?.focus_subsystems).toContain("google_oauth");
  });
});

