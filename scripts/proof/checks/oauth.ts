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

  async function validateAccessToken(accessToken: string): Promise<{
    ok: true;
  } | {
    ok: false;
    status?: number;
    reason: ReasonCode;
    error: string;
  }> {
    try {
      const resp = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (resp.ok) return { ok: true };

      const status = resp.status;
      const bodyText = await resp.text().catch(() => '');
      if (status === 401) return { ok: false, status, reason: 'TOKEN_EXPIRED', error: bodyText || 'Unauthorized' };
      if (status === 403) return { ok: false, status, reason: 'AUTH_FAILED', error: bodyText || 'Forbidden' };
      return { ok: false, status, reason: 'API_UNREACHABLE', error: bodyText || `HTTP ${status}` };
    } catch (err) {
      return {
        ok: false,
        reason: 'API_UNREACHABLE',
        error: err instanceof Error ? err.message : 'Network error',
      };
    }
  }

  async function refreshAccessToken(refreshToken: string): Promise<{
    ok: true;
    accessToken: string;
  } | {
    ok: false;
    status?: number;
    reason: ReasonCode;
    error: string;
  }> {
    if (!clientId || !clientSecret) {
      return { ok: false, reason: 'MISSING_CREDENTIALS', error: 'Missing OAuth client credentials' };
    }

    try {
      const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });

      const resp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      const json = (await resp.json().catch(() => null)) as null | { access_token?: string; error?: string; error_description?: string };

      if (!resp.ok) {
        const status = resp.status;
        const errCode = json?.error;
        const errDesc = json?.error_description;
        // invalid_grant is the common response when a refresh token is revoked/expired
        if (status === 400 && errCode === 'invalid_grant') {
          return { ok: false, status, reason: 'AUTH_FAILED', error: errDesc || 'invalid_grant' };
        }
        return { ok: false, status, reason: 'API_UNREACHABLE', error: errDesc || errCode || `HTTP ${status}` };
      }

      if (!json?.access_token) {
        return { ok: false, reason: 'API_UNREACHABLE', error: 'No access_token in refresh response' };
      }

      return { ok: true, accessToken: json.access_token };
    } catch (err) {
      return {
        ok: false,
        reason: 'API_UNREACHABLE',
        error: err instanceof Error ? err.message : 'Network error',
      };
    }
  }

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

    function looksLikeOAuthConnection(scopes: unknown, refreshToken: unknown): boolean {
      const s = Array.isArray(scopes) ? scopes.filter((v): v is string => typeof v === 'string') : [];
      if (s.length === 0) return false;
      // Ignore IMAP test connections (used by /api/test-sync).
      if (s.includes('imap')) return false;
      if (typeof refreshToken === 'string' && refreshToken.startsWith('imap-')) return false;
      return s.some((scope) => scope.includes('googleapis.com/auth/'));
    }

    // Check 2: Look for stored tokens/connections
    // Schema uses: status, scopes, encrypted_refresh_token, last_synced_at
    const { data: connections, error: connError } = await supabase
      .from('google_connections')
      .select('created_at, updated_at, scopes, status, encrypted_refresh_token, encrypted_dek, last_synced_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10);

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

    const oauthConn = connections.find((c) => looksLikeOAuthConnection(c.scopes, c.encrypted_refresh_token));
    if (!oauthConn) {
      return buildResult('configured', ['NO_TOKEN', 'NO_DATA_OBSERVED_YET'], {
        note: 'No OAuth-scoped active connection found (ignoring IMAP test connections)',
        active_connections_found: connections.length,
      });
    }

    // We have an active OAuth connection
    const conn = oauthConn;
    const refreshToken = typeof conn.encrypted_refresh_token === 'string' ? conn.encrypted_refresh_token : '';
    const storedAccessToken = typeof conn.encrypted_dek === 'string' ? conn.encrypted_dek : '';
    const hasRefreshToken = refreshToken.length > 0;

    if (!hasRefreshToken) {
      return buildResult('configured', ['NO_TOKEN'], {
        note: 'Connection record exists but no refresh token stored',
      }, {
        last_connect_at: conn.created_at,
      });
    }

    // Check 3: Prove the token works via a real API call
    let tokenSource: 'stored_access_token' | 'refreshed_access_token' | 'none' = 'none';
    let tokenValid = false;

    if (storedAccessToken) {
      const v = await validateAccessToken(storedAccessToken);
      if (v.ok) {
        tokenValid = true;
        tokenSource = 'stored_access_token';
      }
    }

    if (!tokenValid && hasRefreshToken) {
      const refreshed = await refreshAccessToken(refreshToken);
      if (refreshed.ok) {
        const v = await validateAccessToken(refreshed.accessToken);
        if (v.ok) {
          tokenValid = true;
          tokenSource = 'refreshed_access_token';
        } else {
          return buildResult('error', [v.reason], {
            note: 'Token refresh succeeded but API call failed',
            token_source: 'refreshed_access_token',
            api_status: v.status,
          }, {
            scopes: conn.scopes || configuredScopes,
            last_connect_at: conn.updated_at || conn.created_at,
          });
        }
      } else {
        return buildResult('error', [refreshed.reason], {
          note: 'Failed to refresh access token',
          refresh_status: refreshed.status,
          error: refreshed.error,
        }, {
          scopes: conn.scopes || configuredScopes,
          last_connect_at: conn.updated_at || conn.created_at,
        });
      }
    }

    if (!tokenValid) {
      return buildResult('error', ['AUTH_FAILED'], {
        note: 'Stored token present but API call did not succeed',
        token_source: storedAccessToken ? 'stored_access_token' : 'none',
      }, {
        scopes: conn.scopes || configuredScopes,
        last_connect_at: conn.updated_at || conn.created_at,
      });
    }

    // Check 4: Has the connection been used recently?
    // If last_synced_at exists and is recent, we can consider it "verified"
    const lastSynced = conn.last_synced_at ? new Date(conn.last_synced_at) : null;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (lastSynced && lastSynced > twentyFourHoursAgo) {
      // Recent successful sync - verified
      return buildResult('verified', ['ALL_CHECKS_PASSED', 'DATA_FLOWING'], {
        connection_status: conn.status,
        has_refresh_token: true,
        token_source: tokenSource,
        last_synced_at: conn.last_synced_at,
        note: 'Active connection with recent successful sync',
      }, {
        scopes: conn.scopes || configuredScopes,
        last_connect_at: conn.last_synced_at || conn.updated_at || conn.created_at,
        token_valid: true,
      });
    }

    // Token exists and a real API call succeeds - connected
    return buildResult('connected', ['ALL_CHECKS_PASSED'], {
      connection_status: conn.status,
      has_refresh_token: true,
      token_source: tokenSource,
      note: 'Token validated via API call (no recent sync observed)',
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
