import { EvidenceBundle, isValidEvidence } from './types';

// Load evidence from the public directory (for client-side)
export async function loadEvidence(): Promise<EvidenceBundle | null> {
  try {
    const response = await fetch('/evidence/evidence.json');
    if (!response.ok) {
      console.error('Failed to load evidence:', response.statusText);
      return null;
    }
    const data = await response.json();
    if (!isValidEvidence(data)) {
      console.error('Invalid evidence format');
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error loading evidence:', error);
    return null;
  }
}

// Load evidence synchronously from file system (for server-side/build time)
export function loadEvidenceSync(): EvidenceBundle | null {
  try {
    // This is used during build/SSR
    const fs = require('fs');
    const path = require('path');
    const evidencePath = path.join(process.cwd(), 'public', 'evidence', 'evidence.json');

    if (!fs.existsSync(evidencePath)) {
      return null;
    }

    const content = fs.readFileSync(evidencePath, 'utf-8');
    const data = JSON.parse(content);

    if (!isValidEvidence(data)) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

// Get placeholder evidence for when no real evidence exists
export function getPlaceholderEvidence(): EvidenceBundle {
  const now = new Date().toISOString();
  return {
    product: 'Executive Intent',
    generated_at: now,
    builder: 'Claude Code',
    commit: {
      hash: 'pending',
      branch: 'main',
    },
    ci: {
      provider: 'github-actions',
      workflow: 'deploy.yml',
      run_id: 'pending',
      run_url: 'https://github.com/intent-solutions-io/executive-intent/actions',
    },
    deploy: {
      target: 'firebase-hosting',
      firebase_project: 'executive-intent',
      site: 'executive-intent',
      channel: 'live',
      url: 'https://executive-intent.web.app',
      completed_at: now,
    },
    integrations: {
      supabase: {
        status: 'configured',
        rationale: {
          reason_codes: ['NO_DATA_OBSERVED'],
          details: { note: 'Evidence not yet generated' },
        },
        project_ref: 'abseweczdjkqxvvptqrv',
        schema_version: '003',
        pgvector: true,
        rls_verified: true,
        document_count: 0,
        chunk_count: 0,
        vector_count: 0,
        checked_at: now,
      },
      inngest: {
        status: 'configured',
        rationale: {
          reason_codes: ['NO_DATA_OBSERVED'],
          details: { note: 'Evidence not yet generated' },
        },
        env: 'production',
        last_run_ids: [],
        last_success_at: null,
        recent_failures: 0,
        checked_at: now,
      },
      nightfall: {
        status: 'configured',
        rationale: {
          reason_codes: ['NO_DATA_OBSERVED'],
          details: { note: 'Evidence not yet generated' },
        },
        policy_name: 'executive-intent-dlp',
        last_scan_counts: { allowed: 0, redacted: 0, quarantined: 0 },
        last_scan_at: null,
        checked_at: now,
      },
      google_oauth: {
        status: 'configured',
        rationale: {
          reason_codes: ['NO_TOKEN'],
          details: { note: 'Evidence not yet generated' },
        },
        scopes: ['gmail.readonly', 'calendar.readonly'],
        last_connect_at: null,
        token_valid: false,
        checked_at: now,
      },
      embeddings: {
        status: 'configured',
        rationale: {
          reason_codes: ['NO_DATA_OBSERVED'],
          details: { note: 'Evidence not yet generated' },
        },
        vector_count: 0,
        last_index_at: null,
        retrieval_test: {
          query_count: 0,
          success_count: 0,
          top_k: 10,
          threshold: 8,
          passed: false,
          failures: { no_results: 0, errors: 0 },
          samples: [],
        },
        checked_at: now,
      },
    },
    pipeline_health: {
      status: 'configured',
      rationale: {
        reason_codes: ['NO_DATA_OBSERVED'],
        details: { note: 'Evidence not yet generated' },
      },
      subsystem_statuses: {
        supabase: 'configured',
        inngest: 'configured',
        nightfall: 'configured',
        google_oauth: 'configured',
        embeddings: 'configured',
      },
      documents_total: 0,
      documents_chunked: 0,
      documents_embedded: 0,
      documents_dlp_scanned: 0,
      fully_processed: 0,
      processing_rate: '0/0 (0%)',
    },
    redactions: {
      rules_applied: ['tokens', 'passwords', 'api_keys', 'emails_in_content'],
    },
    notes: 'Evidence will be generated on next CI deploy.',
  };
}
