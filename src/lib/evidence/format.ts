import { IntegrationStatus, EvidenceBundle } from './types';

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

// Get status color class
export function getStatusColor(status: IntegrationStatus): string {
  switch (status) {
    case 'OK':
      return 'text-green-600 bg-green-100';
    case 'DEGRADED':
      return 'text-yellow-600 bg-yellow-100';
    case 'BLOCKED':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

// Get status icon
export function getStatusIcon(status: IntegrationStatus): string {
  switch (status) {
    case 'OK':
      return '✓';
    case 'DEGRADED':
      return '!';
    case 'BLOCKED':
      return '✗';
    default:
      return '?';
  }
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

  lines.push('## Integration Status');
  lines.push('');

  // Supabase
  const sb = evidence.integrations.supabase;
  lines.push(`### Supabase: ${sb.status}`);
  if (sb.reason) lines.push(`> ${sb.reason}`);
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
  lines.push(`### Inngest: ${ig.status}`);
  if (ig.reason) lines.push(`> ${ig.reason}`);
  lines.push(`- Environment: ${ig.env}`);
  lines.push(`- Last Run IDs: ${ig.last_run_ids.length > 0 ? ig.last_run_ids.join(', ') : 'None'}`);
  lines.push(`- Last Success: ${formatTimestamp(ig.last_success_at)}`);
  lines.push(`- Checked: ${formatTimestamp(ig.checked_at)}`);
  lines.push('');

  // Nightfall
  const nf = evidence.integrations.nightfall;
  lines.push(`### Nightfall DLP: ${nf.status}`);
  if (nf.reason) lines.push(`> ${nf.reason}`);
  lines.push(`- Policy: ${nf.policy_name}`);
  lines.push(`- Scans: ${formatNumber(nf.last_scan_counts.allowed)} allowed, ${formatNumber(nf.last_scan_counts.redacted)} redacted, ${formatNumber(nf.last_scan_counts.quarantined)} quarantined`);
  lines.push(`- Checked: ${formatTimestamp(nf.checked_at)}`);
  lines.push('');

  // Google OAuth
  const oauth = evidence.integrations.google_oauth;
  lines.push(`### Google OAuth: ${oauth.status}`);
  if (oauth.reason) lines.push(`> ${oauth.reason}`);
  lines.push(`- Scopes: ${oauth.scopes.join(', ')}`);
  lines.push(`- Last Connect: ${formatTimestamp(oauth.last_connect_at)}`);
  lines.push(`- Checked: ${formatTimestamp(oauth.checked_at)}`);
  lines.push('');

  // Embeddings
  const emb = evidence.integrations.embeddings;
  lines.push(`### Embeddings: ${emb.status}`);
  if (emb.reason) lines.push(`> ${emb.reason}`);
  lines.push(`- Vector Count: ${formatNumber(emb.vector_count)}`);
  lines.push(`- Last Index: ${formatTimestamp(emb.last_index_at)}`);
  lines.push(`- Retrieval Test: ${emb.retrieval_test.returned}/${emb.retrieval_test.top_k} returned`);
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
