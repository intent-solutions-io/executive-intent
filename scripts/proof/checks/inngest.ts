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
    return buildResult('configured', ['NO_DATA_OBSERVED_YET'], {
      note: 'Inngest credentials set but cannot verify workflow runs (no Supabase access)',
    }, { env });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Evidence of activity comes from audit_events emitted by Inngest functions.
    const INNGEST_AUDIT_ACTIONS = [
      'google_oauth_initialized',
      'google_disconnected',
      'gmail_sync_completed',
      'dlp_allowed',
      'dlp_redacted',
      'dlp_quarantined',
      'embedding_indexed',
    ];

    const { data: recentEvents, error: eventsError } = await supabase
      .from('audit_events')
      .select('id, action, object_id, created_at, metadata')
      .in('action', INNGEST_AUDIT_ACTIONS)
      .order('created_at', { ascending: false })
      .limit(25);

    if (eventsError) {
      return buildResult('error', ['API_UNREACHABLE'], {
        error: eventsError.message,
        note: 'Could not query audit_events for Inngest activity',
      }, { env });
    }

    const lastSuccessAt = recentEvents?.[0]?.created_at || null;
    const lastRunIds = (recentEvents || []).slice(0, 3).map(e => e.id);

    // Heuristic "failures": DLP audit events where Nightfall scan did not run (metadata.scanned === false).
    const recentFailures = (recentEvents || []).filter((e: { action?: string; metadata?: unknown }) => {
      if (typeof e.action !== 'string') return false;
      if (!e.action.startsWith('dlp_')) return false;
      const m = e.metadata as Record<string, unknown> | null;
      return Boolean(m && m.scanned === false);
    }).length;

    // Queue/backlog: pending documents older than 60 minutes
    const backlogCutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const [{ count: pendingTotal, error: pendingTotalError }, { count: pendingBacklog, error: pendingBacklogError }] = await Promise.all([
      supabase.from('documents').select('id', { count: 'exact', head: true }).eq('dlp_status', 'pending'),
      supabase.from('documents').select('id', { count: 'exact', head: true }).eq('dlp_status', 'pending').lt('created_at', backlogCutoff),
    ]);

    const pendingErrors = [pendingTotalError, pendingBacklogError].filter(Boolean);
    if (pendingErrors.length > 0) {
      return buildResult('error', ['API_UNREACHABLE'], {
        note: 'Could not compute pending/backlog documents for Inngest health',
        errors: pendingErrors.map(e => e?.message),
      }, { env });
    }

    const pending = pendingTotal || 0;
    const backlog = pendingBacklog || 0;

    if (!recentEvents || recentEvents.length === 0) {
      return buildResult('configured', ['NO_DATA_OBSERVED_YET'], {
        note: 'Inngest configured; no observable workflow activity yet (no audit_events)',
        pending_documents: pending,
        backlog_documents: backlog,
      }, { env });
    }

    if (backlog > 0) {
      return buildResult('degraded', ['QUEUE_BACKED_UP'], {
        note: `${backlog} pending documents older than 60 minutes`,
        pending_documents: pending,
        backlog_documents: backlog,
        backlog_cutoff: backlogCutoff,
      }, {
        env,
        last_run_ids: lastRunIds,
        last_success_at: lastSuccessAt,
        recent_failures: recentFailures,
      });
    }

    if (pending > 0) {
      return buildResult('processing', ['DATA_FLOWING'], {
        note: `${pending} documents pending DLP scan`,
        pending_documents: pending,
        backlog_documents: backlog,
      }, {
        env,
        last_run_ids: lastRunIds,
        last_success_at: lastSuccessAt,
        recent_failures: recentFailures,
      });
    }

    if (recentFailures > 0) {
      return buildResult('degraded', ['JOBS_FAILING'], {
        note: `${recentFailures} DLP scans recorded with scanned=false in recent audit events`,
        recent_failures: recentFailures,
      }, {
        env,
        last_run_ids: lastRunIds,
        last_success_at: lastSuccessAt,
        recent_failures: recentFailures,
      });
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const lastSuccessDate = lastSuccessAt ? new Date(lastSuccessAt) : null;

    if (lastSuccessDate && lastSuccessDate > twentyFourHoursAgo) {
      return buildResult('verified', ['ALL_CHECKS_PASSED', 'DATA_FLOWING'], {
        note: 'Recent Inngest workflow activity observed in audit_events (within 24h)',
        last_success_at: lastSuccessAt,
      }, {
        env,
        last_run_ids: lastRunIds,
        last_success_at: lastSuccessAt,
        recent_failures: recentFailures,
      });
    }

    return buildResult('degraded', ['STALE_DATA'], {
      note: 'No Inngest workflow activity observed in the last 24h (based on audit_events)',
      last_success_at: lastSuccessAt,
    }, {
      env,
      last_run_ids: lastRunIds,
      last_success_at: lastSuccessAt,
      recent_failures: recentFailures,
    });

  } catch (error) {
    return buildResult('error', ['API_UNREACHABLE'], {
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { env });
  }
}
