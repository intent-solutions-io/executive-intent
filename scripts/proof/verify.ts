#!/usr/bin/env npx tsx
/**
 * Evidence Bundle Verifier for Executive Intent
 *
 * Validates evidence.json for schema correctness and secret detection
 * Run with: pnpm proof:verify
 */

import * as fs from 'fs';
import * as path from 'path';
import { isValidEvidence, StageOrder } from '../../src/lib/evidence/types';
import type { EvidenceBundle, IntegrationStatus } from '../../src/lib/evidence/types';

// Forbidden patterns that should never appear in evidence
const FORBIDDEN_PATTERNS = [
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, // JWT tokens
  /sk-[A-Za-z0-9]{20,}/g, // API keys
  /NF-[A-Za-z0-9]{20,}/g, // Nightfall keys
  /GOCSPX-[A-Za-z0-9_-]+/g, // Google OAuth secrets
  /ghp_[A-Za-z0-9]{30,}/g, // GitHub tokens
  /gsk_[A-Za-z0-9]{40,}/g, // Groq keys
  /re_[A-Za-z0-9_]{15,}/g, // Resend keys
  /signkey-[a-z]+-[a-f0-9]{30,}/g, // Inngest signing keys
  /password["\s]*[:=]["\s]*["'][^"']{8,}["']/gi, // Passwords
  /secret["\s]*[:=]["\s]*["'][^"']{8,}["']/gi, // Secrets
  /Bearer\s+[A-Za-z0-9_-]{20,}/g, // Bearer tokens
];

// Required fields that must be present
const REQUIRED_FIELDS = [
  'product',
  'generated_at',
  'builder',
  'commit.hash',
  'commit.branch',
  'ci.provider',
  'ci.run_id',
  'ci.run_url',
  'deploy.url',
  'deploy.completed_at',
  'integrations.supabase.status',
  'integrations.inngest.status',
  'integrations.nightfall.status',
  'integrations.google_oauth.status',
  'integrations.embeddings.status',
  'pipeline_health.status',
];

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Check if a status is considered "good" (verified or processing)
 */
function isGoodStatus(status: IntegrationStatus): boolean {
  return status === 'verified' || status === 'processing' || status === 'connected';
}

function verifyEvidence(): boolean {
  const evidencePath = path.join(process.cwd(), 'public', 'evidence', 'evidence.json');
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log('🔍 Verifying evidence bundle...\n');

  // Check file exists
  if (!fs.existsSync(evidencePath)) {
    console.error('❌ FAILED: evidence.json not found');
    console.error(`   Expected at: ${evidencePath}`);
    console.error('   Run: pnpm proof:generate');
    process.exit(1);
  }

  // Load and parse JSON
  let evidence: EvidenceBundle;
  try {
    const content = fs.readFileSync(evidencePath, 'utf-8');
    evidence = JSON.parse(content);
  } catch (error) {
    console.error('❌ FAILED: Invalid JSON in evidence.json');
    console.error(`   ${error instanceof Error ? error.message : 'Parse error'}`);
    process.exit(1);
  }

  // Validate schema
  if (!isValidEvidence(evidence)) {
    errors.push('Evidence does not match required schema');
  }

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    const value = getNestedValue(evidence as unknown as Record<string, unknown>, field);
    if (value === undefined || value === null || value === '') {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check timestamps are valid ISO dates
  const timestamps = [
    evidence.generated_at,
    evidence.deploy.completed_at,
    evidence.integrations.supabase.checked_at,
    evidence.integrations.inngest.checked_at,
    evidence.integrations.nightfall.checked_at,
    evidence.integrations.google_oauth.checked_at,
    evidence.integrations.embeddings.checked_at,
  ];

  for (const ts of timestamps) {
    if (ts && isNaN(Date.parse(ts))) {
      errors.push(`Invalid timestamp: ${ts}`);
    }
  }

  // Check for forbidden patterns (secrets)
  const contentStr = JSON.stringify(evidence);
  for (const pattern of FORBIDDEN_PATTERNS) {
    pattern.lastIndex = 0; // Reset regex state
    if (pattern.test(contentStr)) {
      errors.push(`SECURITY: Forbidden pattern detected (potential secret leak)`);
      break;
    }
  }

  // Check verified/connected statuses have required details
  const { integrations } = evidence;

  if (isGoodStatus(integrations.supabase.status)) {
    if (!integrations.supabase.project_ref) {
      warnings.push('Supabase verified but missing project_ref');
    }
  }

  if (isGoodStatus(integrations.inngest.status)) {
    if (!integrations.inngest.env) {
      warnings.push('Inngest verified but missing env');
    }
  }

  if (isGoodStatus(integrations.nightfall.status)) {
    if (!integrations.nightfall.policy_name) {
      warnings.push('Nightfall verified but missing policy_name');
    }
  }

  // Check pipeline health
  if (evidence.pipeline_health) {
    const ph = evidence.pipeline_health;
    if (ph.documents_total > 0 && ph.fully_processed === 0) {
      warnings.push(`Pipeline has ${ph.documents_total} docs but none fully processed`);
    }
  }

  // Check evidence.md also exists
  const mdPath = path.join(process.cwd(), 'public', 'evidence', 'evidence.md');
  if (!fs.existsSync(mdPath)) {
    warnings.push('evidence.md not found (optional but recommended)');
  }

  // Report results
  console.log('Evidence Summary:');
  console.log(`  Product: ${evidence.product}`);
  console.log(`  Builder: ${evidence.builder}`);
  console.log(`  Commit: ${evidence.commit.hash.substring(0, 7)}`);
  console.log(`  Generated: ${evidence.generated_at}`);
  console.log('');

  console.log('Pipeline Health:');
  console.log(`  Status: ${evidence.pipeline_health.status}`);
  console.log(`  Processing Rate: ${evidence.pipeline_health.processing_rate}`);
  console.log('');

  console.log('Integration Status:');
  console.log(`  Supabase:     ${evidence.integrations.supabase.status}`);
  console.log(`  Inngest:      ${evidence.integrations.inngest.status}`);
  console.log(`  Nightfall:    ${evidence.integrations.nightfall.status}`);
  console.log(`  Google OAuth: ${evidence.integrations.google_oauth.status}`);
  console.log(`  Embeddings:   ${evidence.integrations.embeddings.status}`);
  console.log('');

  if (warnings.length > 0) {
    console.log('⚠️  Warnings:');
    warnings.forEach(w => console.log(`   - ${w}`));
    console.log('');
  }

  if (errors.length > 0) {
    console.log('❌ FAILED: Verification errors:');
    errors.forEach(e => console.log(`   - ${e}`));
    process.exit(1);
  }

  console.log('✅ Evidence bundle verified successfully!');
  return true;
}

// Run
verifyEvidence();
