// Google OAuth Integration Check
import { createClient } from '@supabase/supabase-js';
import type {
  GoogleOAuthIntegration,
  IntegrationStatus,
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
    // Schema uses: status, scopes, encrypted_refresh_token, last_synced_at
    const { data: connections, error: connError } = await supabase
      .from('google_connections')
      .select('created_at, updated_at, scopes, status, encrypted_refresh_token, last_synced_at')
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
      return buildResult('configured', ['NO_TOKEN', 'NO_DATA_OBSERVED'], {
        note: 'OAuth credentials configured, awaiting first user connection',
      });
    }

    // We have an active connection
    const conn = connections[0];
    const hasToken = !!conn.encrypted_refresh_token;

    if (!hasToken) {
      return buildResult('configured', ['NO_TOKEN'], {
        note: 'Connection record exists but no refresh token stored',
      }, {
        last_connect_at: conn.created_at,
      });
    }

    // Check 3: Has the connection been used recently?
    // If last_synced_at exists and is recent, we can consider it "verified"
    const lastSynced = conn.last_synced_at ? new Date(conn.last_synced_at) : null;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (lastSynced && lastSynced > twentyFourHoursAgo) {
      // Recent successful sync - verified
      return buildResult('verified', ['ALL_CHECKS_PASSED', 'DATA_FLOWING'], {
        connection_status: conn.status,
        has_token: true,
        last_synced_at: conn.last_synced_at,
        note: 'Active connection with recent successful sync',
      }, {
        scopes: conn.scopes || configuredScopes,
        last_connect_at: conn.last_synced_at || conn.updated_at || conn.created_at,
        token_valid: true,
      });
    }

    // Token exists and connection is active - this is "connected"
    return buildResult('connected', ['ALL_CHECKS_PASSED'], {
      connection_status: conn.status,
      has_token: true,
      note: 'Active connection with token (no recent sync observed)',
    }, {
      scopes: conn.scopes || configuredScopes,
      last_connect_at: conn.updated_at || conn.created_at,
      token_valid: true,
    });

  } catch (error) {
    return buildResult('error', ['API_UNREACHABLE'], {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
