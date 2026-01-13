// Nightfall DLP Integration Check
import { createClient } from '@supabase/supabase-js';
import type {
  NightfallIntegration,
  IntegrationStatus,
  ReasonCode,
} from '../../../src/lib/evidence/types';

export async function checkNightfall(): Promise<NightfallIntegration> {
  const now = new Date().toISOString();
  const apiKey = process.env.NIGHTFALL_API_KEY;

  // Helper to build result
  const buildResult = (
    status: IntegrationStatus,
    reason_codes: ReasonCode[],
    details: Record<string, unknown>,
    overrides: Partial<NightfallIntegration> = {}
  ): NightfallIntegration => ({
    status,
    rationale: { reason_codes, details },
    policy_name: 'executive-intent-dlp',
    last_scan_counts: { allowed: 0, redacted: 0, quarantined: 0 },
    last_scan_at: null,
    checked_at: now,
    ...overrides,
  });

  // Check 1: API key present?
  if (!apiKey) {
    return buildResult('error', ['MISSING_CREDENTIALS'], {
      missing: ['NIGHTFALL_API_KEY'],
    });
  }

  // Check 2: API reachable / key valid (probe scan)
  try {
    const probeBody = {
      payload: ['Executive Intent DLP probe'],
      config: {
        detectionRules: [
          {
            logicalOp: 'ANY',
            detectors: [
              {
                detectorType: 'NIGHTFALL_DETECTOR',
                nightfallDetector: 'EMAIL_ADDRESS',
                minConfidence: 'POSSIBLE',
                minNumFindings: 1,
              },
            ],
          },
        ],
      },
    };

    const resp = await fetch('https://api.nightfall.ai/v3/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(probeBody),
    });

    if (!resp.ok) {
      const status = resp.status;
      const bodyText = await resp.text().catch(() => '');
      if (status === 401 || status === 403) {
        return buildResult('error', ['AUTH_FAILED'], {
          note: 'Nightfall API key rejected by Nightfall API',
          api_status: status,
          error: bodyText || `HTTP ${status}`,
        });
      }
      return buildResult('error', ['API_UNREACHABLE'], {
        note: 'Nightfall API probe failed',
        api_status: status,
        error: bodyText || `HTTP ${status}`,
      });
    }
  } catch (error) {
    return buildResult('error', ['API_UNREACHABLE'], {
      note: 'Nightfall API probe failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Check for actual scan data in Supabase
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // API reachable, but can't verify scan history without Supabase
    return buildResult('connected', ['ALL_CHECKS_PASSED'], {
      note: 'Nightfall API reachable; cannot check scan history (no Supabase access)',
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query documents for DLP status counts (+ pending backlog)
    const [allowedResult, redactedResult, quarantinedResult, pendingResult] = await Promise.all([
      supabase.from('documents').select('id', { count: 'exact', head: true }).eq('dlp_status', 'allowed'),
      supabase.from('documents').select('id', { count: 'exact', head: true }).eq('dlp_status', 'redacted'),
      supabase.from('documents').select('id', { count: 'exact', head: true }).eq('dlp_status', 'quarantined'),
      supabase.from('documents').select('id', { count: 'exact', head: true }).eq('dlp_status', 'pending'),
    ]);

    const scanCounts = {
      allowed: allowedResult.count || 0,
      redacted: redactedResult.count || 0,
      quarantined: quarantinedResult.count || 0,
    };

    const totalScanned = scanCounts.allowed + scanCounts.redacted + scanCounts.quarantined;
    const pendingCount = pendingResult.count || 0;

    // Get last scan timestamp
    const { data: lastScanDoc } = await supabase
      .from('documents')
      .select('updated_at')
      .not('dlp_status', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1);

    const lastScanAt = lastScanDoc?.[0]?.updated_at || null;

    let status: IntegrationStatus = 'connected';
    let reason_codes: ReasonCode[] = ['ALL_CHECKS_PASSED'];
    const details: Record<string, unknown> = {
      api_probe: 'ok',
      scan_counts: scanCounts,
      total_scanned: totalScanned,
      pending_count: pendingCount,
      last_scan_at: lastScanAt,
    };

    if (totalScanned === 0) {
      // API reachable, but no DLP outcomes observed yet
      status = 'connected';
      reason_codes = ['NO_DATA_OBSERVED_YET', 'ZERO_SCANS'];
      details.note = 'Nightfall API reachable; no DLP outcomes observed yet';
    } else if (pendingCount > 0) {
      // Some documents still pending DLP -> processing
      status = 'processing';
      reason_codes = ['DATA_FLOWING'];
      details.note = `DLP processing: ${totalScanned} processed, ${pendingCount} pending`;
    } else {
      // At least one observed allow/redact/quarantine outcome -> verified
      status = 'verified';
      reason_codes = ['ALL_CHECKS_PASSED', 'DATA_FLOWING'];
      details.note = `DLP verified: ${scanCounts.allowed} allowed, ${scanCounts.redacted} redacted, ${scanCounts.quarantined} quarantined`;
    }

    return buildResult(status, reason_codes, details, {
      last_scan_counts: scanCounts,
      last_scan_at: lastScanAt,
    });

  } catch (error) {
    return buildResult('error', ['API_UNREACHABLE'], {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
