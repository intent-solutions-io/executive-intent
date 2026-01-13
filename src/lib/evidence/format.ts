import { IntegrationStatus, EvidenceBundle, StatusRationale } from './types';

// Format a timestamp for display
export function formatTimestamp(iso: string | null): string {
  if (!iso) return 'Never';
  try {
    const date = new Date(iso);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return iso;
  }
}

// Format relative time
export function formatRelativeTime(iso: string | null): string {
  if (!iso) return 'Never';
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatTimestamp(iso);
  } catch {
    return iso;
  }
}

/**
 * Get status color class for Tailwind CSS
 *
 * Color mapping:
 * - verified: GREEN (only status that gets green - proven end-to-end)
 * - processing: BLUE (actively working)
 * - connected: BLUE/CYAN (established connection)
 * - configured: GRAY (neutral - not yet proven)
 * - degraded: YELLOW/ORANGE (warning - needs attention)
 * - error: RED (critical failure)
 */
export function getStatusColor(status: IntegrationStatus): string {
  switch (status) {
    case 'verified':
      return 'bg-status-verified-bg text-status-verified-text';
    case 'processing':
      return 'bg-status-processing-bg text-status-processing-text';
    case 'connected':
      return 'bg-status-connected-bg text-status-connected-text';
    case 'configured':
      return 'bg-status-configured-bg text-status-configured-text';
    case 'degraded':
      return 'bg-status-degraded-bg text-status-degraded-text';
    case 'error':
      return 'bg-status-error-bg text-status-error-text';
    default:
      return 'bg-status-configured-bg text-status-configured-text';
  }
}

/**
 * Get status badge variant for UI components
 */
export function getStatusVariant(status: IntegrationStatus): 'success' | 'info' | 'warning' | 'error' | 'default' {
  switch (status) {
    case 'verified':
      return 'success';
    case 'processing':
    case 'connected':
      return 'info';
    case 'degraded':
      return 'warning';
    case 'error':
      return 'error';
    case 'configured':
    default:
      return 'default';
  }
}

/**
 * Get status icon
 */
export function getStatusIcon(status: IntegrationStatus): string {
  switch (status) {
    case 'verified':
      return '✓';
    case 'processing':
      return '⟳';
    case 'connected':
      return '◉';
    case 'configured':
      return '○';
    case 'degraded':
      return '⚠';
    case 'error':
      return '✗';
    default:
      return '?';
  }
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: IntegrationStatus): string {
  switch (status) {
    case 'verified':
      return 'Verified';
    case 'processing':
      return 'Processing';
    case 'connected':
      return 'Connected';
    case 'configured':
      return 'Configured';
    case 'degraded':
      return 'Degraded';
    case 'error':
      return 'Error';
    default:
      return 'Unknown';
  }
}

/**
 * Format status rationale for display
 */
export function formatRationale(rationale: StatusRationale): string {
  const codes = rationale.reason_codes.join(', ');
  const note = rationale.details?.note;
  if (note && typeof note === 'string') {
    return `${note} [${codes}]`;
  }
  return codes;
}

/**
 * Format a short rationale (note + first 1–2 reason codes).
 * Intended for UI summaries where long details belong in the JSON disclosure.
 */
export function formatRationaleShort(rationale: StatusRationale, maxCodes = 2): string {
  const note = rationale.details?.note;
  const codes = rationale.reason_codes.slice(0, maxCodes).join(', ');
  if (note && typeof note === 'string' && codes) return `${note} [${codes}]`;
  if (note && typeof note === 'string') return note;
  return codes || '—';
}

// Truncate commit hash
export function formatCommitHash(hash: string): string {
  if (hash.length > 7) {
    return hash.substring(0, 7);
  }
  return hash;
}

// Format a number with commas
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

// Generate markdown from evidence
export function generateEvidenceMarkdown(evidence: EvidenceBundle): string {
  const lines: string[] = [];

  lines.push('# Executive Intent - Evidence Bundle');
  lines.push('');
  lines.push(`**Generated:** ${formatTimestamp(evidence.generated_at)}`);
  lines.push(`**Builder:** ${evidence.builder}`);
  lines.push('');

  lines.push('## Receipts');
  lines.push('');
  lines.push(`- **Commit:** \`${evidence.commit.hash}\` (${evidence.commit.branch})`);
  lines.push(`- **CI Run:** [${evidence.ci.run_id}](${evidence.ci.run_url})`);
  lines.push(`- **Deploy URL:** [${evidence.deploy.url}](${evidence.deploy.url})`);
  lines.push(`- **Deployed:** ${formatTimestamp(evidence.deploy.completed_at)}`);
  lines.push('');

  // Pipeline Health Summary
  lines.push('## Pipeline Health');
  lines.push('');
  const ph = evidence.pipeline_health;
  lines.push(`**Overall Status:** ${getStatusIcon(ph.status)} ${getStatusLabel(ph.status)}`);
  lines.push('');
  lines.push(`> ${formatRationale(ph.rationale)}`);
  lines.push('');
  lines.push('| Metric | Count |');
  lines.push('|--------|-------|');
  lines.push(`| Documents Total | ${formatNumber(ph.documents_total)} |`);
  lines.push(`| Documents Chunked | ${formatNumber(ph.documents_chunked)} |`);
  lines.push(`| Documents Embedded | ${formatNumber(ph.documents_embedded)} |`);
  lines.push(`| Documents DLP Scanned | ${formatNumber(ph.documents_dlp_scanned)} |`);
  lines.push(`| Fully Processed | ${formatNumber(ph.fully_processed)} |`);
  lines.push(`| **Processing Rate** | **${ph.processing_rate}** |`);
  lines.push('');

  lines.push('### Subsystem Status');
  lines.push('');
  lines.push('| Subsystem | Status |');
  lines.push('|-----------|--------|');
  for (const [name, status] of Object.entries(ph.subsystem_statuses)) {
    lines.push(`| ${name} | ${getStatusIcon(status)} ${getStatusLabel(status)} |`);
  }
  lines.push('');

  lines.push('## Integration Details');
  lines.push('');

  // Supabase
  const sb = evidence.integrations.supabase;
  lines.push(`### Supabase: ${getStatusIcon(sb.status)} ${getStatusLabel(sb.status)}`);
  lines.push(`> ${formatRationale(sb.rationale)}`);
  lines.push('');
  lines.push(`- Project: \`${sb.project_ref}\``);
  lines.push(`- Schema Version: ${sb.schema_version}`);
  lines.push(`- pgvector: ${sb.pgvector ? 'Enabled' : 'Disabled'}`);
  lines.push(`- RLS: ${sb.rls_verified ? 'Verified' : 'Not Verified'}`);
  lines.push(`- Documents: ${formatNumber(sb.document_count)}`);
  lines.push(`- Chunks: ${formatNumber(sb.chunk_count)}`);
  lines.push(`- Vectors: ${formatNumber(sb.vector_count)}`);
  lines.push(`- Checked: ${formatTimestamp(sb.checked_at)}`);
  lines.push('');

  // Inngest
  const ig = evidence.integrations.inngest;
  lines.push(`### Inngest: ${getStatusIcon(ig.status)} ${getStatusLabel(ig.status)}`);
  lines.push(`> ${formatRationale(ig.rationale)}`);
  lines.push('');
  lines.push(`- Environment: ${ig.env}`);
  lines.push(`- Recent Failures: ${ig.recent_failures}`);
  lines.push(`- Last Run IDs: ${ig.last_run_ids.length > 0 ? ig.last_run_ids.join(', ') : 'None'}`);
  lines.push(`- Last Success: ${formatTimestamp(ig.last_success_at)}`);
  lines.push(`- Checked: ${formatTimestamp(ig.checked_at)}`);
  lines.push('');

  // Nightfall
  const nf = evidence.integrations.nightfall;
  lines.push(`### Nightfall DLP: ${getStatusIcon(nf.status)} ${getStatusLabel(nf.status)}`);
  lines.push(`> ${formatRationale(nf.rationale)}`);
  lines.push('');
  lines.push(`- Policy: ${nf.policy_name}`);
  lines.push(`- Scans: ${formatNumber(nf.last_scan_counts.allowed)} allowed, ${formatNumber(nf.last_scan_counts.redacted)} redacted, ${formatNumber(nf.last_scan_counts.quarantined)} quarantined`);
  lines.push(`- Last Scan: ${formatTimestamp(nf.last_scan_at)}`);
  lines.push(`- Checked: ${formatTimestamp(nf.checked_at)}`);
  lines.push('');

  // Google OAuth
  const oauth = evidence.integrations.google_oauth;
  lines.push(`### Google OAuth: ${getStatusIcon(oauth.status)} ${getStatusLabel(oauth.status)}`);
  lines.push(`> ${formatRationale(oauth.rationale)}`);
  lines.push('');
  lines.push(`- Token Valid: ${oauth.token_valid ? 'Yes' : 'No'}`);
  lines.push(`- Scopes: ${oauth.scopes.length > 0 ? oauth.scopes.join(', ') : 'None configured'}`);
  lines.push(`- Last Connect: ${formatTimestamp(oauth.last_connect_at)}`);
  lines.push(`- Checked: ${formatTimestamp(oauth.checked_at)}`);
  lines.push('');

  // Embeddings
  const emb = evidence.integrations.embeddings;
  lines.push(`### Embeddings: ${getStatusIcon(emb.status)} ${getStatusLabel(emb.status)}`);
  lines.push(`> ${formatRationale(emb.rationale)}`);
  lines.push('');
  lines.push(`- Vector Count: ${formatNumber(emb.vector_count)}`);
  lines.push(`- Last Index: ${formatTimestamp(emb.last_index_at)}`);
  lines.push('');

  // Retrieval Test Details
  const rt = emb.retrieval_test;
  lines.push('#### Retrieval Test');
  lines.push('');
  lines.push(`- **Result:** ${rt.passed ? '✓ PASSED' : '✗ FAILED'}`);
  lines.push(`- Success Rate: ${rt.success_count}/${rt.query_count} (threshold: ${rt.threshold})`);
  lines.push(`- Top-K: ${rt.top_k}`);
  if (rt.failures.no_results > 0 || rt.failures.errors > 0) {
    lines.push(`- Failures: ${rt.failures.no_results} no results, ${rt.failures.errors} errors`);
  }
  lines.push('');

  // Sample results if available
  if (rt.samples && rt.samples.length > 0) {
    lines.push('##### Sample Queries');
    lines.push('');
    for (const sample of rt.samples) {
      lines.push(`**Query:** "${sample.query}"`);
      if (sample.results.length > 0) {
        lines.push('| Doc ID | Chunk ID | Score |');
        lines.push('|--------|----------|-------|');
        for (const r of sample.results) {
          lines.push(`| ${r.doc_id.substring(0, 8)}... | ${r.chunk_id.substring(0, 8)}... | ${r.score.toFixed(3)} |`);
        }
      } else {
        lines.push('_No results_');
      }
      lines.push('');
    }
  }

  lines.push(`- Checked: ${formatTimestamp(emb.checked_at)}`);
  lines.push('');

  lines.push('## Security');
  lines.push('');
  lines.push(`Redaction rules applied: ${evidence.redactions.rules_applied.join(', ')}`);
  lines.push('');

  if (evidence.notes) {
    lines.push('## Notes');
    lines.push('');
    lines.push(evidence.notes);
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('*This evidence bundle was generated automatically by the CI pipeline.*');

  return lines.join('\n');
}

// Alias for backwards compatibility
export const generateMarkdownSummary = generateEvidenceMarkdown;
