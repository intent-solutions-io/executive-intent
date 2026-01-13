import { computePipelineHealth } from "@/lib/evidence/pipelineHealth";
import { isValidEvidence, type EvidenceBundle } from "@/lib/evidence/types";

describe("EvidenceBundle fixture", () => {
  it("matches a stable snapshot shape", () => {
    const now = "2026-01-01T00:00:00.000Z";

    const integrations: EvidenceBundle["integrations"] = {
      supabase: {
        status: "connected",
        rationale: {
          reason_codes: ["NO_DATA_OBSERVED_YET"],
          details: { note: "Database reachable; no documents observed yet" },
        },
        project_ref: "test",
        schema_version: "003",
        pgvector: true,
        rls_verified: true,
        document_count: 0,
        chunk_count: 0,
        vector_count: 0,
        checked_at: now,
      },
      inngest: {
        status: "configured",
        rationale: {
          reason_codes: ["NO_DATA_OBSERVED_YET"],
          details: { note: "Inngest configured; no observable workflow activity yet" },
        },
        env: "production",
        last_run_ids: [],
        last_success_at: null,
        recent_failures: 0,
        checked_at: now,
      },
      nightfall: {
        status: "connected",
        rationale: {
          reason_codes: ["NO_DATA_OBSERVED_YET"],
          details: { note: "Nightfall API reachable; no DLP outcomes observed yet" },
        },
        policy_name: "executive-intent-dlp",
        last_scan_counts: { allowed: 0, redacted: 0, quarantined: 0 },
        last_scan_at: null,
        checked_at: now,
      },
      google_oauth: {
        status: "configured",
        rationale: {
          reason_codes: ["NO_TOKEN"],
          details: { note: "OAuth credentials configured, awaiting first user connection" },
        },
        scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
        last_connect_at: null,
        token_valid: false,
        checked_at: now,
      },
      embeddings: {
        status: "error",
        rationale: {
          reason_codes: ["MISSING_CREDENTIALS"],
          details: { note: "OPENAI_API_KEY not set" },
        },
        vector_count: 0,
        last_index_at: null,
        retrieval_test: {
          query_count: 0,
          success_count: 0,
          top_k: 10,
          threshold: 8,
          passed: false,
          failures: { no_results: 0, errors: 0 },
          samples: [],
        },
        checked_at: now,
      },
    };

    const pipeline_health = computePipelineHealth(integrations, {
      documents_total: 0,
      documents_chunked: 0,
      documents_embedded: 0,
    });

    const evidence: EvidenceBundle = {
      product: "Executive Intent",
      generated_at: now,
      builder: "vitest",
      commit: { hash: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef", branch: "main" },
      ci: {
        provider: "github-actions",
        workflow: "deploy.yml",
        run_id: "123456789",
        run_url: "https://github.com/intent-solutions-io/executive-intent/actions/runs/123456789",
      },
      deploy: {
        target: "firebase-hosting",
        firebase_project: "executive-intent",
        site: "executive-intent",
        channel: "live",
        url: "https://executive-intent.web.app",
        completed_at: now,
      },
      integrations,
      pipeline_health,
      redactions: { rules_applied: ["tokens", "api_keys"] },
      notes: "Fixture evidence bundle used for schema stability testing.",
    };

    expect(isValidEvidence(evidence)).toBe(true);
    expect(evidence).toMatchSnapshot();
  });
});
