// Embeddings Integration Check
import { createClient } from '@supabase/supabase-js';
import type {
  EmbeddingsIntegration,
  IntegrationStatus,
  ReasonCode,
  RetrievalTest,
  RetrievalSample,
} from '../../../src/lib/evidence/types';
import { generateEmbeddings, getEmbeddingModel } from '../../../src/lib/embeddings/provider';

// Generate content-aware retrieval probes from actual chunks
async function getContentAwareQueries(
  supabase: ReturnType<typeof createClient>,
  tenantId: string,
  maxQueries: number = 10
): Promise<string[]> {
  // Get sample chunk texts to derive semantic queries
  const { data: chunks } = await supabase
    .from('document_chunks')
    .select('chunk_text')
    .eq('tenant_id', tenantId)
    .not('chunk_text', 'is', null)
    .limit(maxQueries);

  if (!chunks || chunks.length === 0) {
    return [];
  }

  // Extract key phrases from each chunk (first 5-10 words)
  const queries: string[] = [];
  const seen = new Set<string>();

  for (const chunk of chunks) {
    const text = (chunk.chunk_text || '').trim();
    if (!text) continue;

    // Extract first meaningful phrase (5-10 words)
    const words = text.split(/\s+/).slice(0, 8).join(' ');
    const normalized = words.toLowerCase();

    if (!seen.has(normalized) && words.length > 10) {
      seen.add(normalized);
      queries.push(words);
    }
  }

  return queries.slice(0, maxQueries);
}

export async function checkEmbeddings(): Promise<EmbeddingsIntegration> {
  const now = new Date().toISOString();

  const gcpProjectId = process.env.GCP_PROJECT_ID;
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

    const provider_configured = Boolean(gcpProjectId);
    const provider_name = getEmbeddingModel();

    // No vectors yet (provider may be reachable, but no indexed data observed)
    if (!vectorCount || vectorCount === 0) {
      if (!provider_configured) {
        return buildResult('error', ['MISSING_CREDENTIALS'], {
          missing: ['GCP_PROJECT_ID'],
          note: 'No embeddings indexed and Vertex AI is not configured',
          provider_configured,
          provider_name,
        }, {
          vector_count: 0,
          last_index_at: lastIndexAt,
        });
      }

      // Prove the embedding provider is reachable (no-op probe embedding)
      const probe = await testVertexAIEmbeddings(['Executive Intent embedding probe']);
      if (!probe.ok) {
        return buildResult('error', [probe.reason], {
          note: 'Vertex AI embedding probe failed',
          error: probe.error,
          provider_configured,
          provider_name,
        }, {
          vector_count: 0,
          last_index_at: lastIndexAt,
        });
      }

      return buildResult('connected', ['NO_DATA_OBSERVED_YET'], {
        note: 'Vertex AI embedding provider reachable; no vectors indexed yet',
        provider_configured,
        provider_name,
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
      // Use content-aware queries derived from actual chunks
      queries = await getContentAwareQueries(supabase, tenantId);
      if (queries.length === 0) {
        // Fallback: no content to query
        return buildResult('configured', ['NO_DATA_OBSERVED_YET'], {
          note: 'Vectors exist but no queryable content found',
          provider_configured,
          provider_name,
        }, {
          vector_count: vectorCount || 0,
          last_index_at: lastIndexAt,
        });
      }
      const embedded = await testVertexAIEmbeddings(queries);
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
          note: 'Vertex AI could not embed retrieval probes',
          error: embedded.error,
          provider_configured,
          provider_name,
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
      provider_name,
    };

    if (!provider_configured) {
      status = 'degraded';
      reason_codes = retrievalTest.passed
        ? ['MISSING_CREDENTIALS', 'THRESHOLD_MET']
        : retrievalTest.query_count > 0
          ? ['MISSING_CREDENTIALS', 'RETRIEVAL_BELOW_THRESHOLD']
          : ['MISSING_CREDENTIALS', 'NO_DATA_OBSERVED_YET'];
      details.note = retrievalTest.passed
        ? 'Retrieval works with existing vectors, but GCP_PROJECT_ID is missing so new embeddings cannot be generated'
        : 'GCP_PROJECT_ID is missing (Vertex AI embedding generation disabled)';
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

/**
 * Test Vertex AI embeddings using the shared provider
 */
async function testVertexAIEmbeddings(inputs: string[]): Promise<
  | { ok: true; embeddings: number[][] }
  | { ok: false; reason: ReasonCode; error: string }
> {
  try {
    const embeddings = await generateEmbeddings(inputs);
    return { ok: true, embeddings };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    // Check for auth errors
    if (message.includes('401') || message.includes('403') || message.includes('permission')) {
      return { ok: false, reason: 'AUTH_FAILED', error: message };
    }

    return { ok: false, reason: 'API_UNREACHABLE', error: message };
  }
}
