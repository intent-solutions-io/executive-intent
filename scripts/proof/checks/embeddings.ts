// Embeddings Integration Check
import { createClient } from '@supabase/supabase-js';
import type {
  EmbeddingsIntegration,
  IntegrationStatus,
  ReasonCode,
  RetrievalTest,
  RetrievalSample,
} from '../../../src/lib/evidence/types';

const OPENAI_EMBEDDING_URL = 'https://api.openai.com/v1/embeddings';
const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';
const OPENAI_EMBEDDING_DIMENSIONS = 768;

// Deterministic, non-sensitive retrieval probes
const TEST_QUERIES = [
  'executive summary',
  'action items',
  'meeting notes',
  'project status',
  'quarterly review',
  'budget allocation',
  'team updates',
  'deadline',
  'deliverables',
  'next steps',
] as const;

export async function checkEmbeddings(): Promise<EmbeddingsIntegration> {
  const now = new Date().toISOString();

  const openaiKey = process.env.OPENAI_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Helper to build result
  const buildResult = (
    status: IntegrationStatus,
    reason_codes: ReasonCode[],
    details: Record<string, unknown>,
    overrides: Partial<EmbeddingsIntegration> = {}
  ): EmbeddingsIntegration => ({
    status,
    rationale: { reason_codes, details },
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
    ...overrides,
  });

  // Check 1: Vector store credentials present?
  if (!supabaseUrl || !supabaseKey) {
    return buildResult('error', ['MISSING_CREDENTIALS'], {
      missing: [
        !supabaseUrl && 'SUPABASE_URL',
        !supabaseKey && 'SUPABASE_SERVICE_ROLE_KEY',
      ].filter(Boolean),
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check 2: Can we query the embedding column? (pgvector configured)
    const { error: pgvectorError } = await supabase
      .from('document_chunks')
      .select('embedding')
      .limit(1);

    if (pgvectorError) {
      return buildResult('error', ['API_UNREACHABLE'], {
        error: pgvectorError.message,
        note: 'pgvector extension may not be configured',
      });
    }

    // pgvector is reachable - at least "connected" (vector store reachable)

    // Check 3: Count vectors
    const { count: vectorCount, error: countError } = await supabase
      .from('document_chunks')
      .select('id', { count: 'exact', head: true })
      .not('embedding', 'is', null);

    if (countError) {
      return buildResult('configured', ['API_UNREACHABLE'], {
        error: countError.message,
        note: 'Could not count vectors',
      });
    }

    // Get most recent embedding timestamp
    const { data: latestChunk } = await supabase
      .from('document_chunks')
      .select('created_at')
      .not('embedding', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);

    const lastIndexAt = latestChunk?.[0]?.created_at || null;

    const provider_configured = Boolean(openaiKey);

    // No vectors yet (provider may be reachable, but no indexed data observed)
    if (!vectorCount || vectorCount === 0) {
      if (!provider_configured) {
        return buildResult('error', ['MISSING_CREDENTIALS'], {
          missing: ['OPENAI_API_KEY'],
          note: 'No embeddings indexed and embedding provider is not configured',
          provider_configured,
        }, {
          vector_count: 0,
          last_index_at: lastIndexAt,
        });
      }

      // Prove the embedding provider is reachable (no-op probe embedding)
      const probe = await fetchOpenAIEmbeddings(openaiKey!, ['Executive Intent embedding probe']);
      if (!probe.ok) {
        return buildResult('error', [probe.reason], {
          note: 'Embedding provider probe failed',
          api_status: probe.status,
          error: probe.error,
          provider_configured,
        }, {
          vector_count: 0,
          last_index_at: lastIndexAt,
        });
      }

      return buildResult('connected', ['NO_DATA_OBSERVED_YET'], {
        note: 'Embedding provider reachable; no vectors indexed yet',
        provider_configured,
      }, {
        vector_count: 0,
        last_index_at: lastIndexAt,
      });
    }

    // Determine tenant scope for deterministic retrieval probe
    const { data: tenantRow, error: tenantError } = await supabase
      .from('document_chunks')
      .select('tenant_id')
      .not('embedding', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (tenantError) {
      return buildResult('error', ['API_UNREACHABLE'], {
        error: tenantError.message,
        note: 'Could not determine tenant_id for retrieval test',
      }, {
        vector_count: vectorCount || 0,
        last_index_at: lastIndexAt,
      });
    }

    const tenantId = tenantRow?.[0]?.tenant_id as string | undefined;
    if (!tenantId) {
      return buildResult('degraded', ['NO_DATA_OBSERVED'], {
        note: 'Vectors exist but could not determine tenant scope for retrieval test',
      }, {
        vector_count: vectorCount || 0,
        last_index_at: lastIndexAt,
      });
    }

    let queries: string[] = [];
    let queryEmbeddings: number[][] = [];

    if (provider_configured) {
      queries = [...TEST_QUERIES];
      const embedded = await fetchOpenAIEmbeddings(openaiKey!, queries);
      if (!embedded.ok) {
        const retrieval_test: RetrievalTest = {
          query_count: queries.length,
          success_count: 0,
          top_k: 10,
          threshold: 8,
          passed: false,
          failures: { no_results: 0, errors: queries.length },
          samples: queries.slice(0, 3).map((query) => ({ query, results: [] })),
        };

        return buildResult('degraded', ['API_UNREACHABLE'], {
          note: 'Embedding provider could not embed retrieval probes',
          api_status: embedded.status,
          error: embedded.error,
          provider_configured,
        }, {
          vector_count: vectorCount || 0,
          last_index_at: lastIndexAt,
          retrieval_test,
        });
      }

      queryEmbeddings = embedded.embeddings;
    } else {
      const { data: chunks, error: chunksError } = await supabase
        .from('document_chunks')
        .select('id, document_id, embedding')
        .eq('tenant_id', tenantId)
        .not('embedding', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (chunksError) {
        return buildResult('degraded', ['API_UNREACHABLE'], {
          note: 'Could not load sample embeddings for retrieval probe',
          error: chunksError.message,
          provider_configured,
        }, {
          vector_count: vectorCount || 0,
          last_index_at: lastIndexAt,
        });
      }

      for (const row of (chunks || []) as Array<{ id?: string; embedding?: unknown }>) {
        if (!row.id) continue;
        const parsed = parseEmbedding(row.embedding);
        if (!parsed) continue;
        queries.push(`probe:chunk:${row.id.substring(0, 8)}`);
        queryEmbeddings.push(parsed);
      }
    }

    const retrievalTest = queries.length > 0
      ? await runRetrievalTests({
        supabase,
        tenantId,
        queries,
        queryEmbeddings,
      })
      : {
        query_count: 0,
        success_count: 0,
        top_k: 10,
        threshold: 8,
        passed: false,
        failures: { no_results: 0, errors: 0 },
        samples: [],
      };

    // Determine status based on vector presence and retrieval test
    // Verified only if retrieval meets threshold (no greenwashing).
    let status: IntegrationStatus;
    let reason_codes: ReasonCode[] = [];
    const details: Record<string, unknown> = {
      vector_count: vectorCount,
      last_index_at: lastIndexAt,
      retrieval_success_rate: `${retrievalTest.success_count}/${retrievalTest.query_count}`,
      provider_configured,
    };

    if (!provider_configured) {
      status = 'degraded';
      reason_codes = retrievalTest.passed
        ? ['MISSING_CREDENTIALS', 'THRESHOLD_MET']
        : retrievalTest.query_count > 0
          ? ['MISSING_CREDENTIALS', 'RETRIEVAL_BELOW_THRESHOLD']
          : ['MISSING_CREDENTIALS', 'NO_DATA_OBSERVED_YET'];
      details.note = retrievalTest.passed
        ? 'Retrieval works with existing vectors, but OPENAI_API_KEY is missing so new embeddings cannot be generated'
        : 'OPENAI_API_KEY is missing (embedding generation disabled)';
    } else if (retrievalTest.query_count > 0 && retrievalTest.failures.errors === retrievalTest.query_count) {
      status = 'error';
      reason_codes = ['API_UNREACHABLE'];
      details.note = `Retrieval probe failed for all queries (${retrievalTest.query_count})`;
    } else if (retrievalTest.passed) {
      status = 'verified';
      reason_codes = ['THRESHOLD_MET', 'DATA_FLOWING'];
      details.note = `Retrieval verified (${retrievalTest.success_count}/${retrievalTest.query_count} >= ${retrievalTest.threshold})`;
    } else if (retrievalTest.failures.errors > 0) {
      status = 'degraded';
      reason_codes = ['API_UNREACHABLE'];
      details.note = `Retrieval probe encountered errors (${retrievalTest.failures.errors}/${retrievalTest.query_count})`;
    } else {
      status = 'degraded';
      reason_codes = ['RETRIEVAL_BELOW_THRESHOLD'];
      details.note = `Retrieval below threshold (${retrievalTest.success_count}/${retrievalTest.query_count}, need ${retrievalTest.threshold})`;
    }

    return buildResult(status, reason_codes, details, {
      vector_count: vectorCount,
      last_index_at: lastIndexAt,
      retrieval_test: retrievalTest,
    });

  } catch (error) {
    return buildResult('error', ['API_UNREACHABLE'], {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function parseEmbedding(value: unknown): number[] | null {
  if (Array.isArray(value) && value.every((v) => typeof v === 'number')) return value as number[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed) && parsed.every((v) => typeof v === 'number')) return parsed as number[];
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Run retrieval tests against the vector store
 * Uses semantic query embeddings + match_documents RPC.
 */
async function runRetrievalTests(params: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
  tenantId: string;
  queries: string[];
  queryEmbeddings: number[][];
}): Promise<RetrievalTest> {
  const top_k = 10;
  // Need 8/10 queries to return results; scale down when the dataset is smaller.
  const threshold = Math.min(8, params.queries.length);
  const match_threshold = 0.5;

  const samples: RetrievalSample[] = [];
  let successCount = 0;
  let noResultsCount = 0;
  let errorsCount = 0;

  const perQuery: Array<{ query: string; results: RetrievalSample['results']; ok: boolean; error?: string }> = [];

  for (let i = 0; i < params.queries.length; i++) {
    const query = params.queries[i];
    const queryEmbedding = params.queryEmbeddings[i];

    try {
      const { data, error } = await params.supabase.rpc(
        'match_documents',
        {
          query_embedding: queryEmbedding,
          match_threshold,
          match_count: top_k,
          filter_tenant_id: params.tenantId,
        } as never
      );

      if (error) {
        errorsCount++;
        perQuery.push({ query, results: [], ok: false, error: error.message });
        continue;
      }

      const rows = (data || []) as Array<{
        id: string;
        document_id: string;
        similarity: number;
      }>;

      const results = rows.slice(0, 3).map((r) => ({
        doc_id: r.document_id || 'unknown',
        chunk_id: r.id || 'unknown',
        score: typeof r.similarity === 'number' ? r.similarity : 0,
      }));

      if (rows.length > 0) {
        successCount++;
        perQuery.push({ query, results, ok: true });
      } else {
        noResultsCount++;
        perQuery.push({ query, results: [], ok: true });
      }
    } catch (err) {
      errorsCount++;
      perQuery.push({ query, results: [], ok: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }

  // Samples: prefer successes, then failures, capped at 3
  for (const s of perQuery.filter((q) => q.ok && q.results.length > 0).slice(0, 3)) {
    samples.push({ query: s.query, results: s.results });
  }
  if (samples.length < 3) {
    for (const s of perQuery.filter((q) => samples.every((x) => x.query !== q.query)).slice(0, 3 - samples.length)) {
      samples.push({ query: s.query, results: s.results });
    }
  }

  return {
    query_count: params.queries.length,
    success_count: successCount,
    top_k,
    threshold,
    passed: successCount >= threshold,
    failures: {
      no_results: noResultsCount,
      errors: errorsCount,
    },
    samples,
  };
}

async function fetchOpenAIEmbeddings(apiKey: string, inputs: string[]): Promise<
  | { ok: true; embeddings: number[][] }
  | { ok: false; status?: number; reason: ReasonCode; error: string }
> {
  try {
    const resp = await fetch(OPENAI_EMBEDDING_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_EMBEDDING_MODEL,
        input: inputs,
        dimensions: OPENAI_EMBEDDING_DIMENSIONS,
      }),
    });

    const status = resp.status;
    if (!resp.ok) {
      const bodyText = await resp.text().catch(() => '');
      if (status === 401 || status === 403) {
        return { ok: false, status, reason: 'AUTH_FAILED', error: bodyText || `HTTP ${status}` };
      }
      return { ok: false, status, reason: 'API_UNREACHABLE', error: bodyText || `HTTP ${status}` };
    }

    const json = (await resp.json().catch(() => null)) as null | {
      data?: Array<{ embedding?: number[]; index?: number }>;
    };

    const data = Array.isArray(json?.data) ? json!.data! : [];
    const sorted = data
      .map((d, idx) => ({ embedding: d.embedding, index: typeof d.index === 'number' ? d.index : idx }))
      .sort((a, b) => a.index - b.index);

    const embeddings = sorted.map((d) => Array.isArray(d.embedding) ? d.embedding : []);

    if (embeddings.length !== inputs.length || embeddings.some((e) => e.length !== OPENAI_EMBEDDING_DIMENSIONS)) {
      return { ok: false, reason: 'API_UNREACHABLE', error: 'Unexpected embedding response shape/dimensions' };
    }

    return { ok: true, embeddings };
  } catch (err) {
    return {
      ok: false,
      reason: 'API_UNREACHABLE',
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}
