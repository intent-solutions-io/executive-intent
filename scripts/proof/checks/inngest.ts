// Inngest Integration Check
import { createClient } from '@supabase/supabase-js';
import type {
  InngestIntegration,
  IntegrationStatus,
  ReasonCode,
} from '../../../src/lib/evidence/types';

export async function checkInngest(): Promise<InngestIntegration> {
  const now = new Date().toISOString();
  const eventKey = process.env.INNGEST_EVENT_KEY;
  const signingKey = process.env.INNGEST_SIGNING_KEY;

  // Helper to build result
  const buildResult = (
    status: IntegrationStatus,
    reason_codes: ReasonCode[],
    details: Record<string, unknown>,
    overrides: Partial<InngestIntegration> = {}
  ): InngestIntegration => ({
    status,
    rationale: { reason_codes, details },
    env: 'production',
    last_run_ids: [],
    last_success_at: null,
    recent_failures: 0,
    checked_at: now,
    ...overrides,
  });

  // Check 1: Required env vars present?
  if (!eventKey || !signingKey) {
    return buildResult('error', ['MISSING_CREDENTIALS'], {
      missing: [
        !eventKey && 'INNGEST_EVENT_KEY',
        !signingKey && 'INNGEST_SIGNING_KEY',
      ].filter(Boolean),
    });
  }

  // Determine environment from signing key
  const env = signingKey.includes('prod') ? 'production' : 'development';

  // At this point we have credentials - at least "configured"
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return buildResult('configured', ['NO_DATA_OBSERVED'], {
      note: 'Inngest credentials set but cannot verify workflow runs (no Supabase access)',
    }, { env });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check 2: Look for evidence of Inngest activity via documents
    // If documents exist and have been updated recently, Inngest is working
    const { data: recentDocs, error: docError } = await supabase
      .from('documents')
      .select('id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(10);

    if (docError) {
      return buildResult('configured', ['API_UNREACHABLE'], {
        error: docError.message,
        note: 'Could not query documents table',
      }, { env });
    }

    // No documents at all
    if (!recentDocs || recentDocs.length === 0) {
      return buildResult('configured', ['NO_DATA_OBSERVED'], {
        note: 'Inngest configured but no documents synced yet',
      }, { env });
    }

    // Check if we have recent activity (documents updated in last 24h)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentlyUpdated = recentDocs.filter(
      d => d.updated_at && new Date(d.updated_at) > twentyFourHoursAgo
    );

    // Also check for chunks - if chunks exist, processing has occurred
    const { count: chunkCount } = await supabase
      .from('document_chunks')
      .select('id', { count: 'exact', head: true });

    // Determine status based on evidence
    if (recentlyUpdated.length > 0) {
      // Recent activity - verified
      const mostRecent = recentDocs[0];
      return buildResult('verified', ['ALL_CHECKS_PASSED', 'DATA_FLOWING'], {
        documents_count: recentDocs.length,
        recently_updated: recentlyUpdated.length,
        chunks_processed: chunkCount || 0,
        note: `${recentlyUpdated.length} documents updated in last 24h`,
      }, {
        env,
        last_run_ids: recentDocs.slice(0, 3).map(d => d.id),
        last_success_at: mostRecent.updated_at,
        recent_failures: 0,
      });
    }

    // Documents exist but no recent activity
    if ((chunkCount || 0) > 0) {
      // Has processed chunks - processing status
      return buildResult('processing', ['DATA_FLOWING'], {
        documents_count: recentDocs.length,
        chunks_processed: chunkCount,
        note: 'Documents and chunks exist, no recent updates',
      }, {
        env,
        last_run_ids: recentDocs.slice(0, 3).map(d => d.id),
        last_success_at: recentDocs[0]?.updated_at || null,
        recent_failures: 0,
      });
    }

    // Has documents but no chunks yet - connected
    return buildResult('connected', ['NO_DATA_OBSERVED'], {
      documents_count: recentDocs.length,
      chunks_processed: 0,
      note: 'Documents exist but not yet chunked',
    }, {
      env,
      last_run_ids: recentDocs.slice(0, 3).map(d => d.id),
    });

  } catch (error) {
    return buildResult('error', ['API_UNREACHABLE'], {
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { env });
  }
}
