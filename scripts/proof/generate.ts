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
import { checkSupabase } from './checks/supabase';
import { checkInngest } from './checks/inngest';
import { checkNightfall } from './checks/nightfall';
import { checkOAuth } from './checks/oauth';
import { checkEmbeddings } from './checks/embeddings';
import type { EvidenceBundle, CommitInfo, CIInfo, DeployInfo } from '../../src/lib/evidence/types';
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

// Secret patterns to detect and block
const SECRET_PATTERNS = [
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, // JWT tokens
  /sk-[A-Za-z0-9]{48}/g, // OpenAI keys
  /NF-[A-Za-z0-9]{30,}/g, // Nightfall keys
  /GOCSPX-[A-Za-z0-9_-]+/g, // Google OAuth secrets
  /ghp_[A-Za-z0-9]{36}/g, // GitHub tokens
  /gsk_[A-Za-z0-9]{50,}/g, // Groq keys
  /re_[A-Za-z0-9_]{20,}/g, // Resend keys
  /signkey-[a-z]+-[a-f0-9]+/g, // Inngest signing keys
  // Note: Removed overly broad pattern that was catching git hashes
];

// Check for secrets in output
function containsSecrets(obj: unknown): boolean {
  const str = JSON.stringify(obj);
  return SECRET_PATTERNS.some(pattern => pattern.test(str));
}

// Redact any secrets from the object
function redactSecrets(obj: unknown): unknown {
  const str = JSON.stringify(obj);
  let redacted = str;

  SECRET_PATTERNS.forEach(pattern => {
    redacted = redacted.replace(pattern, '[REDACTED]');
  });

  return JSON.parse(redacted);
}

async function generateEvidence(): Promise<void> {
  console.log('🔍 Generating evidence bundle...\n');

  const now = new Date().toISOString();

  // Run all checks in parallel
  console.log('Running integration checks...');
  const [supabase, inngest, nightfall, google_oauth, embeddings] = await Promise.all([
    checkSupabase().then(r => { console.log(`  ✓ Supabase: ${r.status}`); return r; }),
    checkInngest().then(r => { console.log(`  ✓ Inngest: ${r.status}`); return r; }),
    checkNightfall().then(r => { console.log(`  ✓ Nightfall: ${r.status}`); return r; }),
    checkOAuth().then(r => { console.log(`  ✓ Google OAuth: ${r.status}`); return r; }),
    checkEmbeddings().then(r => { console.log(`  ✓ Embeddings: ${r.status}`); return r; }),
  ]);

  // Build evidence bundle
  const evidence: EvidenceBundle = {
    product: 'Executive Intent',
    generated_at: now,
    builder: 'Claude Code',
    commit: getCommitInfo(),
    ci: getCIInfo(),
    deploy: getDeployInfo(),
    integrations: {
      supabase,
      inngest,
      nightfall,
      google_oauth,
      embeddings,
    },
    redactions: {
      rules_applied: ['tokens', 'passwords', 'api_keys', 'jwt', 'oauth_secrets'],
    },
    notes: generateNotes(supabase, inngest, nightfall, google_oauth, embeddings),
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
  supabase: Awaited<ReturnType<typeof checkSupabase>>,
  inngest: Awaited<ReturnType<typeof checkInngest>>,
  nightfall: Awaited<ReturnType<typeof checkNightfall>>,
  oauth: Awaited<ReturnType<typeof checkOAuth>>,
  embeddings: Awaited<ReturnType<typeof checkEmbeddings>>
): string {
  const notes: string[] = [];

  const allOk = [supabase, inngest, nightfall, oauth, embeddings].every(i => i.status === 'OK');
  const blocked = [supabase, inngest, nightfall, oauth, embeddings].filter(i => i.status === 'BLOCKED');

  if (allOk) {
    notes.push('All integrations verified successfully.');
  } else if (blocked.length > 0) {
    notes.push(`${blocked.length} integration(s) blocked - see details above.`);
  } else {
    notes.push('Some integrations degraded - system operational but needs attention.');
  }

  if (supabase.document_count === 0) {
    notes.push('No documents synced yet - connect Google account to start ingestion.');
  }

  if (embeddings.vector_count === 0) {
    notes.push('No embeddings indexed yet - embeddings will be created after DLP scan.');
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
