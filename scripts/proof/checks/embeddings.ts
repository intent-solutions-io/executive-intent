// Embeddings Integration Check
import { createClient } from '@supabase/supabase-js';
import type { EmbeddingsIntegration } from '../../../src/lib/evidence/types';

export async function checkEmbeddings(): Promise<EmbeddingsIntegration> {
  const now = new Date().toISOString();

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      status: 'BLOCKED',
      reason: 'Missing Supabase credentials for embeddings check',
      vector_count: 0,
      last_index_at: null,
      retrieval_test: { top_k: 10, returned: 0 },
      checked_at: now,
    };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Count chunks with embeddings
    const { count: vectorCount, error: countError } = await supabase
      .from('document_chunks')
      .select('id', { count: 'exact', head: true })
      .not('embedding', 'is', null);

    if (countError) {
      return {
        status: 'DEGRADED',
        reason: `Count query failed: ${countError.message}`,
        vector_count: 0,
        last_index_at: null,
        retrieval_test: { top_k: 10, returned: 0 },
        checked_at: now,
      };
    }

    // Get most recent chunk creation time
    const { data: latestChunk } = await supabase
      .from('document_chunks')
      .select('created_at')
      .not('embedding', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);

    const lastIndexAt = latestChunk?.[0]?.created_at || null;

    // Attempt retrieval test if we have vectors
    let retrievalTest = { top_k: 10, returned: 0 };

    if (vectorCount && vectorCount > 0) {
      // Use the match_documents function if available
      // For now, just count how many we could retrieve
      const { data: retrievalData, error: retrievalError } = await supabase
        .from('document_chunks')
        .select('id')
        .not('embedding', 'is', null)
        .limit(10);

      if (!retrievalError && retrievalData) {
        retrievalTest = { top_k: 10, returned: retrievalData.length };
      }
    }

    // Determine status based on vector presence
    if (vectorCount && vectorCount > 0) {
      return {
        status: 'OK',
        vector_count: vectorCount,
        last_index_at: lastIndexAt,
        retrieval_test: retrievalTest,
        checked_at: now,
      };
    }

    // No vectors yet - check if pgvector is at least set up
    const { error: pgvectorError } = await supabase
      .from('document_chunks')
      .select('embedding')
      .limit(1);

    if (!pgvectorError) {
      return {
        status: 'OK',
        reason: 'pgvector ready, no embeddings indexed yet',
        vector_count: 0,
        last_index_at: null,
        retrieval_test: { top_k: 10, returned: 0 },
        checked_at: now,
      };
    }

    return {
      status: 'DEGRADED',
      reason: 'pgvector not configured properly',
      vector_count: 0,
      last_index_at: null,
      retrieval_test: { top_k: 10, returned: 0 },
      checked_at: now,
    };
  } catch (error) {
    return {
      status: 'BLOCKED',
      reason: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      vector_count: 0,
      last_index_at: null,
      retrieval_test: { top_k: 10, returned: 0 },
      checked_at: now,
    };
  }
}
