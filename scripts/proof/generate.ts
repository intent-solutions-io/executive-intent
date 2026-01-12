#!/usr/bin/env npx tsx
/**
 * Evidence Bundle Generator for Executive Intent
 *
 * Generates public/evidence/evidence.json and evidence.md
 * Run with: pnpm proof:generate
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });
import { checkSupabase, type SupabaseStats } from './checks/supabase';
import { checkInngest } from './checks/inngest';
import { checkNightfall } from './checks/nightfall';
import { checkOAuth } from './checks/oauth';
import { checkEmbeddings } from './checks/embeddings';
import { containsSecrets, redactSecrets } from './redact';
import type {
  EvidenceBundle,
  CommitInfo,
  CIInfo,
  DeployInfo,
  PipelineHealth,
  Integrations,
  IntegrationStatus,
  ReasonCode,
} from '../../src/lib/evidence/types';
import { getMinimumStatus } from '../../src/lib/evidence/types';
import { generateEvidenceMarkdown } from '../../src/lib/evidence/format';

// Get git commit info
function getCommitInfo(): CommitInfo {
  try {
    const hash = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    return { hash, branch };
  } catch {
    return { hash: 'unknown', branch: 'unknown' };
  }
}

// Get CI info from environment
function getCIInfo(): CIInfo {
  // GitHub Actions environment variables
  const runId = process.env.GITHUB_RUN_ID || 'local';
  const workflow = process.env.GITHUB_WORKFLOW || 'local';
  const repo = process.env.GITHUB_REPOSITORY || 'intent-solutions-io/executive-intent';
  const runUrl = runId !== 'local'
    ? `https://github.com/${repo}/actions/runs/${runId}`
    : 'https://github.com/intent-solutions-io/executive-intent/actions';

  return {
    provider: 'github-actions',
    workflow,
    run_id: runId,
    run_url: runUrl,
  };
}

// Get deploy info
function getDeployInfo(): DeployInfo {
  const firebaseProject = process.env.GOOGLE_CLOUD_PROJECT || 'executive-intent';
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://executive-intent.web.app';

  return {
    target: 'firebase-hosting',
    firebase_project: firebaseProject,
    site: 'executive-intent',
    channel: 'live',
    url: siteUrl,
    completed_at: new Date().toISOString(),
  };
}

/**
 * Calculate pipeline health rollup from all integration statuses
 */
function calculatePipelineHealth(
  integrations: Integrations,
  stats?: SupabaseStats
): PipelineHealth {
  // Extract all statuses
  const subsystem_statuses: Record<keyof Integrations, IntegrationStatus> = {
    supabase: integrations.supabase.status,
    inngest: integrations.inngest.status,
    nightfall: integrations.nightfall.status,
    google_oauth: integrations.google_oauth.status,
    embeddings: integrations.embeddings.status,
  };

  // Calculate minimum status across all subsystems
  const allStatuses = Object.values(subsystem_statuses);
  const overallStatus = getMinimumStatus(allStatuses);

  // Get document processing stats
  const documents_total = stats?.documents_total || integrations.supabase.document_count;
  const documents_chunked = stats?.documents_chunked || 0;
  const documents_embedded = stats?.documents_embedded || 0;
  const documents_dlp_scanned = integrations.nightfall.last_scan_counts.allowed +
    integrations.nightfall.last_scan_counts.redacted +
    integrations.nightfall.last_scan_counts.quarantined;

  // Fully processed = documents that have been chunked, embedded, AND DLP scanned
  // Use min of all three as the "fully processed" count
  const fully_processed = Math.min(
    documents_chunked,
    documents_embedded,
    documents_dlp_scanned
  );

  // Calculate processing rate
  const processing_rate = documents_total > 0
    ? `${fully_processed}/${documents_total} (${Math.round((fully_processed / documents_total) * 100)}%)`
    : '0/0 (0%)';

  // Build reason codes based on status
  let reason_codes: ReasonCode[] = [];
  const details: Record<string, unknown> = {
    subsystem_statuses,
  };

  if (overallStatus === 'error') {
    const errorSystems = Object.entries(subsystem_statuses)
      .filter(([, status]) => status === 'error')
      .map(([name]) => name);
    reason_codes = ['API_UNREACHABLE'];
    details.error_systems = errorSystems;
    details.note = `${errorSystems.length} subsystem(s) in error state`;
  } else if (overallStatus === 'degraded') {
    const degradedSystems = Object.entries(subsystem_statuses)
      .filter(([, status]) => status === 'degraded')
      .map(([name]) => name);
    reason_codes = ['JOBS_FAILING'];
    details.degraded_systems = degradedSystems;
    details.note = `${degradedSystems.length} subsystem(s) degraded`;
  } else if (overallStatus === 'configured') {
    reason_codes = ['NO_DATA_OBSERVED'];
    details.note = 'Integrations configured but no data flowing yet';
  } else if (overallStatus === 'connected') {
    reason_codes = ['NO_DATA_OBSERVED'];
    details.note = 'Integrations connected but minimal data observed';
  } else if (overallStatus === 'processing') {
    reason_codes = ['DATA_FLOWING'];
    details.note = 'Pipeline actively processing data';
  } else if (overallStatus === 'verified') {
    reason_codes = ['ALL_CHECKS_PASSED', 'DATA_FLOWING'];
    details.note = 'All subsystems verified and data flowing';
  }

  return {
    status: overallStatus,
    rationale: { reason_codes, details },
    subsystem_statuses,
    documents_total,
    documents_chunked,
    documents_embedded,
    documents_dlp_scanned,
    fully_processed,
    processing_rate,
  };
}

async function generateEvidence(): Promise<void> {
  console.log('🔍 Generating evidence bundle...\n');

  const now = new Date().toISOString();

  // Run all checks in parallel
  console.log('Running integration checks...');
  const [supabaseResult, inngest, nightfall, google_oauth, embeddings] = await Promise.all([
    checkSupabase().then(r => { console.log(`  ✓ Supabase: ${r.status}`); return r; }),
    checkInngest().then(r => { console.log(`  ✓ Inngest: ${r.status}`); return r; }),
    checkNightfall().then(r => { console.log(`  ✓ Nightfall: ${r.status}`); return r; }),
    checkOAuth().then(r => { console.log(`  ✓ Google OAuth: ${r.status}`); return r; }),
    checkEmbeddings().then(r => { console.log(`  ✓ Embeddings: ${r.status}`); return r; }),
  ]);

  // Extract stats from supabase result (if available)
  const supabaseStats = supabaseResult.stats;

  // Remove stats from the integration object (it's only used for pipeline_health)
  const { stats: _, ...supabase } = supabaseResult;

  const integrations: Integrations = {
    supabase,
    inngest,
    nightfall,
    google_oauth,
    embeddings,
  };

  // Calculate pipeline health rollup
  const pipeline_health = calculatePipelineHealth(integrations, supabaseStats);
  console.log(`  → Pipeline Health: ${pipeline_health.status} (${pipeline_health.processing_rate})`);

  // Build evidence bundle
  const evidence: EvidenceBundle = {
    product: 'Executive Intent',
    generated_at: now,
    builder: 'Claude Code',
    commit: getCommitInfo(),
    ci: getCIInfo(),
    deploy: getDeployInfo(),
    integrations,
    pipeline_health,
    redactions: {
      rules_applied: ['tokens', 'passwords', 'api_keys', 'jwt', 'oauth_secrets'],
    },
    notes: generateNotes(integrations, pipeline_health),
  };

  // Security check - ensure no secrets leaked
  if (containsSecrets(evidence)) {
    console.error('\n⚠️  Warning: Potential secrets detected, applying redaction...');
    const redactedEvidence = redactSecrets(evidence) as EvidenceBundle;
    await writeEvidence(redactedEvidence);
  } else {
    await writeEvidence(evidence);
  }

  console.log('\n✅ Evidence bundle generated successfully!');
}

function generateNotes(
  integrations: Integrations,
  pipelineHealth: PipelineHealth
): string {
  const notes: string[] = [];

  // Overall pipeline status
  switch (pipelineHealth.status) {
    case 'verified':
      notes.push('All integrations verified and data flowing end-to-end.');
      break;
    case 'processing':
      notes.push('Pipeline actively processing - some integrations still completing verification.');
      break;
    case 'connected':
      notes.push('Integrations connected but awaiting data - connect Google account to start ingestion.');
      break;
    case 'configured':
      notes.push('Integrations configured but not yet connected - complete setup to begin.');
      break;
    case 'degraded':
      notes.push('Some integrations degraded - system operational but needs attention.');
      break;
    case 'error':
      notes.push('Critical errors detected - immediate attention required.');
      break;
  }

  // Specific guidance
  if (integrations.supabase.document_count === 0) {
    notes.push('No documents synced yet.');
  }

  if (integrations.embeddings.vector_count === 0) {
    notes.push('No embeddings indexed yet.');
  }

  if (pipelineHealth.fully_processed < pipelineHealth.documents_total && pipelineHealth.documents_total > 0) {
    notes.push(`${pipelineHealth.fully_processed} of ${pipelineHealth.documents_total} documents fully processed.`);
  }

  // Retrieval test status
  const retrievalTest = integrations.embeddings.retrieval_test;
  if (retrievalTest.query_count > 0) {
    if (retrievalTest.passed) {
      notes.push(`Retrieval test passed (${retrievalTest.success_count}/${retrievalTest.query_count}).`);
    } else {
      notes.push(`Retrieval test needs improvement (${retrievalTest.success_count}/${retrievalTest.query_count}, need ${retrievalTest.threshold}).`);
    }
  }

  return notes.join(' ');
}

async function writeEvidence(evidence: EvidenceBundle): Promise<void> {
  const outputDir = path.join(process.cwd(), 'public', 'evidence');

  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write JSON
  const jsonPath = path.join(outputDir, 'evidence.json');
  fs.writeFileSync(jsonPath, JSON.stringify(evidence, null, 2));
  console.log(`\n📄 Written: ${jsonPath}`);

  // Write Markdown
  const mdPath = path.join(outputDir, 'evidence.md');
  const markdown = generateEvidenceMarkdown(evidence);
  fs.writeFileSync(mdPath, markdown);
  console.log(`📄 Written: ${mdPath}`);
}

// Run
generateEvidence().catch(error => {
  console.error('❌ Evidence generation failed:', error);
  process.exit(1);
});
