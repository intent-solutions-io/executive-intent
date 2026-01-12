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

  // Check for actual scan data in Supabase
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Can't verify scans without Supabase - API key is configured
    return buildResult('configured', ['NO_DATA_OBSERVED'], {
      note: 'Nightfall API key configured, cannot check scan history (no Supabase access)',
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query documents for DLP status counts
    const [allowedResult, redactedResult, quarantinedResult] = await Promise.all([
      supabase.from('documents').select('id', { count: 'exact', head: true }).eq('dlp_status', 'allowed'),
      supabase.from('documents').select('id', { count: 'exact', head: true }).eq('dlp_status', 'redacted'),
      supabase.from('documents').select('id', { count: 'exact', head: true }).eq('dlp_status', 'quarantined'),
    ]);

    const scanCounts = {
      allowed: allowedResult.count || 0,
      redacted: redactedResult.count || 0,
      quarantined: quarantinedResult.count || 0,
    };

    const totalScanned = scanCounts.allowed + scanCounts.redacted + scanCounts.quarantined;

    // Get last scan timestamp
    const { data: lastScanDoc } = await supabase
      .from('documents')
      .select('updated_at')
      .not('dlp_status', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1);

    const lastScanAt = lastScanDoc?.[0]?.updated_at || null;

    let status: IntegrationStatus;
    let reason_codes: ReasonCode[] = [];
    const details: Record<string, unknown> = {
      scan_counts: scanCounts,
      total_scanned: totalScanned,
      last_scan_at: lastScanAt,
    };

    if (totalScanned === 0) {
      // No scans observed - just configured
      status = 'configured';
      reason_codes = ['ZERO_SCANS', 'NO_DATA_OBSERVED'];
      details.note = 'Nightfall API key configured, no DLP scans observed yet';
    } else if (scanCounts.redacted > 0 || scanCounts.quarantined > 0) {
      // Have observed actual DLP enforcement (found and handled PII)
      status = 'verified';
      reason_codes = ['ALL_CHECKS_PASSED', 'DATA_FLOWING'];
      details.note = `DLP active: ${scanCounts.allowed} allowed, ${scanCounts.redacted} redacted, ${scanCounts.quarantined} quarantined`;
    } else {
      // Only "allowed" documents - DLP is running and scanned documents
      // This proves the integration works even if no PII was found
      status = 'verified';
      reason_codes = ['ALL_CHECKS_PASSED', 'DATA_FLOWING'];
      details.note = `DLP verified: ${totalScanned} documents scanned and allowed (no PII detected)`;
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
