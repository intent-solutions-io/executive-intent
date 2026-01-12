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
    env: 'unknown',
    last_run_ids: [],
    last_success_at: null,
    recent_failures: 0,
    checked_at: now,
    ...overrides,
  });

  // Check 1: Required env vars
  if (!eventKey || !signingKey) {
    return buildResult('error', ['MISSING_CREDENTIALS'], {
      missing: [
        !eventKey && 'INNGEST_EVENT_KEY',
        !signingKey && 'INNGEST_SIGNING_KEY',
      ].filter(Boolean),
    });
  }

  // Determine environment from signing key prefix
  const env = signingKey.startsWith('signkey-prod-') ? 'production' : 'development';

  try {
    // Check for Inngest run records in our audit_events table
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      // Can't verify runs without Supabase, but Inngest is configured
      return buildResult('configured', ['NO_DATA_OBSERVED'], {
        note: 'Inngest keys configured but cannot verify runs (no Supabase access)',
      }, { env });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Look for audit events from Inngest workflows
    const { data: auditEvents, error } = await supabase
      .from('audit_events')
      .select('object_id, created_at, metadata, status')
      .in('action', ['sync', 'dlp_scan', 'embed', 'connect'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return buildResult('configured', ['API_UNREACHABLE'], {
        error: error.message,
        note: 'Could not query audit_events table',
      }, { env });
    }

    // Count recent failures
    const recentFailures = auditEvents?.filter(e => e.status === 'failed').length || 0;

    if (!auditEvents || auditEvents.length === 0) {
      // No audit records yet - try to verify Inngest is reachable
      try {
        const testResponse = await fetch(`https://inn.gs/e/${eventKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'proof/check',
            data: { timestamp: now, type: 'evidence-generation' },
          }),
        });

        if (testResponse.ok) {
          return buildResult('connected', ['NO_DATA_OBSERVED'], {
            note: 'Inngest API reachable, no workflow runs observed yet',
          }, { env });
        } else {
          return buildResult('configured', ['API_UNREACHABLE'], {
            note: `Inngest API returned ${testResponse.status}`,
            status_code: testResponse.status,
          }, { env });
        }
      } catch (fetchError) {
        return buildResult('configured', ['API_UNREACHABLE'], {
          error: fetchError instanceof Error ? fetchError.message : 'Unknown error',
          note: 'Could not reach Inngest API',
        }, { env });
      }
    }

    // We have audit records
    const runIds = auditEvents
      .map(e => e.metadata?.inngest_run_id || e.object_id)
      .filter(Boolean)
      .slice(0, 3);

    const lastSuccess = auditEvents.find(e => e.status !== 'failed');
    const lastSuccessAt = lastSuccess?.created_at || null;

    // Check if last success is within 24 hours
    const isRecent = lastSuccessAt
      ? (Date.now() - new Date(lastSuccessAt).getTime()) < 24 * 60 * 60 * 1000
      : false;

    let status: IntegrationStatus;
    let reason_codes: ReasonCode[] = [];
    const details: Record<string, unknown> = {
      total_events: auditEvents.length,
      recent_failures: recentFailures,
      last_success_at: lastSuccessAt,
    };

    if (recentFailures > auditEvents.length / 2) {
      // More than half are failures
      status = 'degraded';
      reason_codes = ['JOBS_FAILING'];
      details.note = `${recentFailures}/${auditEvents.length} recent events are failures`;
    } else if (!isRecent) {
      // No recent success
      status = 'processing';
      reason_codes = ['STALE_DATA'];
      details.note = 'Last successful run was more than 24 hours ago';
    } else if (isRecent && recentFailures === 0) {
      // Recent success and no failures
      status = 'verified';
      reason_codes = ['ALL_CHECKS_PASSED', 'DATA_FLOWING'];
      details.note = 'Recent successful runs, no failures';
    } else {
      // Recent success but some failures
      status = 'processing';
      reason_codes = ['DATA_FLOWING'];
      details.note = `Processing with ${recentFailures} recent failures`;
    }

    return buildResult(status, reason_codes, details, {
      env,
      last_run_ids: runIds,
      last_success_at: lastSuccessAt,
      recent_failures: recentFailures,
    });

  } catch (error) {
    return buildResult('error', ['API_UNREACHABLE'], {
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { env });
  }
}
