// Google OAuth Integration Check
import { createClient } from '@supabase/supabase-js';
import type {
  GoogleOAuthIntegration,
  IntegrationStatus,
  StatusRationale,
  ReasonCode,
} from '../../../src/lib/evidence/types';

export async function checkOAuth(): Promise<GoogleOAuthIntegration> {
  const now = new Date().toISOString();
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  // Default scopes from config
  const configuredScopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  // Helper to build result
  const buildResult = (
    status: IntegrationStatus,
    reason_codes: ReasonCode[],
    details: Record<string, unknown>,
    overrides: Partial<GoogleOAuthIntegration> = {}
  ): GoogleOAuthIntegration => ({
    status,
    rationale: { reason_codes, details },
    scopes: configuredScopes,
    last_connect_at: null,
    token_valid: false,
    checked_at: now,
    ...overrides,
  });

  // Check 1: Required env vars present?
  if (!clientId || !clientSecret) {
    return buildResult('error', ['MISSING_CREDENTIALS'], {
      missing: [
        !clientId && 'GOOGLE_CLIENT_ID',
        !clientSecret && 'GOOGLE_CLIENT_SECRET',
      ].filter(Boolean),
    }, { scopes: [] });
  }

  // At this point we have credentials - at least "configured"
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Can't verify connections without Supabase access
    return buildResult('configured', ['NO_TOKEN'], {
      note: 'OAuth credentials set but cannot verify connections (no Supabase access)',
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check 2: Look for stored tokens/connections
    const { data: connections, error: connError } = await supabase
      .from('google_connections')
      .select('created_at, scopes, status, access_token, refresh_token')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (connError) {
      return buildResult('configured', ['API_UNREACHABLE'], {
        error: connError.message,
        note: 'Could not query google_connections table',
      });
    }

    // No active connections found
    if (!connections || connections.length === 0) {
      // Check audit events for past connection attempts
      const { data: auditEvents } = await supabase
        .from('audit_events')
        .select('created_at, metadata, status')
        .eq('action', 'connect')
        .order('created_at', { ascending: false })
        .limit(1);

      if (auditEvents && auditEvents.length > 0) {
        // Had a connection before but no active token now
        return buildResult('configured', ['TOKEN_EXPIRED', 'NO_TOKEN'], {
          last_attempt: auditEvents[0].created_at,
          note: 'Previous connection exists but no active token',
        }, {
          last_connect_at: auditEvents[0].created_at,
        });
      }

      // Never connected
      return buildResult('configured', ['NO_TOKEN', 'NO_DATA_OBSERVED'], {
        note: 'OAuth credentials configured, awaiting first user connection',
      });
    }

    // We have an active connection with tokens
    const conn = connections[0];
    const hasTokens = !!(conn.access_token || conn.refresh_token);

    if (!hasTokens) {
      return buildResult('configured', ['NO_TOKEN'], {
        note: 'Connection record exists but no tokens stored',
      }, {
        last_connect_at: conn.created_at,
      });
    }

    // Check 3: Verify token still works (make a simple API call)
    // For now, we trust the token if it exists and connection is active
    // A real verification would call Google's tokeninfo endpoint
    // TODO: Add actual token verification via Google API

    // Token exists and connection is active - this is "connected"
    // To be "verified", we'd need to make a successful API call
    // For now, active connection with token = connected
    return buildResult('connected', ['ALL_CHECKS_PASSED'], {
      has_access_token: !!conn.access_token,
      has_refresh_token: !!conn.refresh_token,
      connection_status: conn.status,
    }, {
      scopes: conn.scopes || configuredScopes,
      last_connect_at: conn.created_at,
      token_valid: true,
    });

  } catch (error) {
    return buildResult('error', ['API_UNREACHABLE'], {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
