// Inngest Integration Check
import { createClient } from '@supabase/supabase-js';
import type { InngestIntegration } from '../../../src/lib/evidence/types';

export async function checkInngest(): Promise<InngestIntegration> {
  const now = new Date().toISOString();
  const eventKey = process.env.INNGEST_EVENT_KEY;
  const signingKey = process.env.INNGEST_SIGNING_KEY;

  if (!eventKey || !signingKey) {
    return {
      status: 'BLOCKED',
      reason: 'Missing INNGEST_EVENT_KEY or INNGEST_SIGNING_KEY',
      env: 'unknown',
      last_run_ids: [],
      last_success_at: null,
      checked_at: now,
    };
  }

  // Determine environment from signing key prefix
  const env = signingKey.startsWith('signkey-prod-') ? 'production' : 'development';

  try {
    // Check for Inngest run records in our audit_events table
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Look for audit events from Inngest workflows
      const { data: auditEvents, error } = await supabase
        .from('audit_events')
        .select('object_id, created_at, metadata')
        .in('action', ['sync', 'dlp_scan', 'embed', 'connect'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && auditEvents && auditEvents.length > 0) {
        const runIds = auditEvents
          .map(e => e.metadata?.inngest_run_id || e.object_id)
          .filter(Boolean)
          .slice(0, 3);

        const lastSuccess = auditEvents[0]?.created_at || null;

        return {
          status: 'OK',
          env,
          last_run_ids: runIds,
          last_success_at: lastSuccess,
          checked_at: now,
        };
      }
    }

    // No audit records yet, but Inngest is configured
    // Verify by sending a test event
    const testResponse = await fetch(`https://inn.gs/e/${eventKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'proof/check',
        data: { timestamp: now, type: 'evidence-generation' },
      }),
    });

    if (testResponse.ok) {
      const result = await testResponse.json();
      return {
        status: 'OK',
        env,
        last_run_ids: result.ids || [],
        last_success_at: now,
        checked_at: now,
      };
    }

    return {
      status: 'DEGRADED',
      reason: 'Inngest configured but no run records found',
      env,
      last_run_ids: [],
      last_success_at: null,
      checked_at: now,
    };
  } catch (error) {
    return {
      status: 'BLOCKED',
      reason: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      env,
      last_run_ids: [],
      last_success_at: null,
      checked_at: now,
    };
  }
}
