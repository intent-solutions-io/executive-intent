// Nightfall DLP Integration Check
import { createClient } from '@supabase/supabase-js';
import type { NightfallIntegration } from '../../../src/lib/evidence/types';

export async function checkNightfall(): Promise<NightfallIntegration> {
  const now = new Date().toISOString();
  const apiKey = process.env.NIGHTFALL_API_KEY;

  if (!apiKey) {
    return {
      status: 'BLOCKED',
      reason: 'Missing NIGHTFALL_API_KEY',
      policy_name: 'unknown',
      last_scan_counts: { allowed: 0, redacted: 0, quarantined: 0 },
      checked_at: now,
    };
  }

  const policyName = 'executive-intent-dlp';

  try {
    // Check for DLP scan records in our audit_events and documents tables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Count documents by DLP status
      const [allowedResult, redactedResult, quarantinedResult] = await Promise.all([
        supabase
          .from('documents')
          .select('id', { count: 'exact', head: true })
          .eq('dlp_status', 'allowed'),
        supabase
          .from('documents')
          .select('id', { count: 'exact', head: true })
          .eq('dlp_status', 'redacted'),
        supabase
          .from('documents')
          .select('id', { count: 'exact', head: true })
          .eq('dlp_status', 'quarantined'),
      ]);

      const counts = {
        allowed: allowedResult.count || 0,
        redacted: redactedResult.count || 0,
        quarantined: quarantinedResult.count || 0,
      };

      const totalScans = counts.allowed + counts.redacted + counts.quarantined;

      if (totalScans > 0) {
        return {
          status: 'OK',
          policy_name: policyName,
          last_scan_counts: counts,
          checked_at: now,
        };
      }
    }

    // No scan records, but verify Nightfall API is reachable with a synthetic test
    const testResponse = await fetch('https://api.nightfall.ai/v3/scan', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payload: ['test verification - no PII'],
        config: {
          detectionRules: [
            {
              logicalOp: 'ANY',
              detectors: [
                {
                  minNumFindings: 1,
                  minConfidence: 'LIKELY',
                  detectorType: 'NIGHTFALL_DETECTOR',
                  nightfallDetector: 'EMAIL_ADDRESS',
                },
              ],
              name: 'Email Detection',
            },
          ],
        },
      }),
    });

    if (testResponse.ok) {
      return {
        status: 'OK',
        policy_name: policyName,
        last_scan_counts: { allowed: 0, redacted: 0, quarantined: 0 },
        checked_at: now,
      };
    }

    const errorData = await testResponse.json().catch(() => ({}));
    return {
      status: 'DEGRADED',
      reason: `API returned ${testResponse.status}: ${errorData.message || 'Unknown error'}`,
      policy_name: policyName,
      last_scan_counts: { allowed: 0, redacted: 0, quarantined: 0 },
      checked_at: now,
    };
  } catch (error) {
    return {
      status: 'BLOCKED',
      reason: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      policy_name: policyName,
      last_scan_counts: { allowed: 0, redacted: 0, quarantined: 0 },
      checked_at: now,
    };
  }
}
