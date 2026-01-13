import { BaseLayout } from '@/components/layout';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Container,
  CopyField,
  DetailsDisclosure,
  Metric,
  Section,
  SectionHeader,
  StatusPill,
  Table,
} from '@/components/ui';
import { formatCommitHash, formatRationaleShort, formatTimestamp } from '@/lib/evidence/format';
import { loadEvidenceSync, getPlaceholderEvidence } from '@/lib/evidence/loadEvidence';
import { VerificationCriteria } from '@/lib/evidence/types';

export const metadata = {
  title: 'Evidence | Executive Intent',
  description: 'Receipts for build, deploy, and system checks.',
};

function DownloadIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6c0 1.657 3.582 3 8 3s8-1.343 8-3-3.582-3-8-3-8 1.343-8 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6v6c0 1.657 3.582 3 8 3s8-1.343 8-3V6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12v6c0 1.657 3.582 3 8 3s8-1.343 8-3v-6" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l7 4v5c0 5-3 9-7 9s-7-4-7-9V7l7-4z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a4 4 0 10-7.464 2H2v4h3v3h3v-3h2.536A4 4 0 0015 7z" />
    </svg>
  );
}

function WorkflowIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4h4v4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 8l-6.5 6.5a2 2 0 01-2.828 0L4 7.828" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12v8h8" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 18a8 8 0 100-16 8 8 0 000 16z" />
    </svg>
  );
}

function CriteriaList({ items, verified }: { items: string[]; verified: boolean }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-body-sm text-neutral-700">
          <span className={verified ? 'mt-0.5 text-status-verified-text' : 'mt-0.5 text-neutral-500'}>
            {verified ? '✓' : '•'}
          </span>
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function EvidencePage() {
  const evidence = loadEvidenceSync() || getPlaceholderEvidence();
  const ph = evidence.pipeline_health;
  const { integrations } = evidence;
  const rt = integrations.embeddings.retrieval_test;

  const reasonSummary = formatRationaleShort(ph.rationale);

  const retrievalHeadline =
    rt.query_count > 0 ? `${rt.success_count}/${rt.query_count}` : '—';

  const retrievalCriteria =
    rt.query_count > 0
      ? `Pass criteria: ≥ ${rt.threshold}/${rt.query_count} queries return results`
      : `Pass criteria: ≥ ${rt.threshold} successful queries (default)`;

  type RetrievalRow = { query: string; doc_id: string; chunk_id: string; score: number };
  const retrievalRows: RetrievalRow[] = rt.samples.flatMap((s) =>
    s.results.map((r) => ({ query: s.query, doc_id: r.doc_id, chunk_id: r.chunk_id, score: r.score }))
  );

  const vectorMismatch = integrations.supabase.vector_count !== integrations.embeddings.vector_count;
  const chunkVectorMismatch = integrations.supabase.chunk_count !== integrations.supabase.vector_count;

  return (
    <BaseLayout currentPath="/evidence" evidenceGeneratedAt={evidence.generated_at}>
      {/* Header */}
      <Section background="white" padding="xl" border="bottom">
        <Container>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <StatusPill status={ph.status} />
                <span className="text-body-sm text-neutral-700">
                  Generated{' '}
                  <span className="font-mono text-neutral-900">
                    {formatTimestamp(evidence.generated_at)}
                  </span>
                </span>
              </div>
              <h1 className="mt-5 text-display-lg md:text-display-xl font-semibold text-neutral-900 tracking-tight">
                Evidence
              </h1>
              <p className="mt-4 text-body-xl text-neutral-700 max-w-prose-wide">
                Receipts for build, deploy, and system checks.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button href="/evidence/evidence.json" variant="primary" size="lg" icon={<DownloadIcon />} className="w-full sm:w-auto">
                evidence.json
              </Button>
              <Button href="/evidence/evidence.md" variant="outline" size="lg" icon={<DownloadIcon />} className="w-full sm:w-auto">
                evidence.md
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      {/* Receipts */}
      <Section background="gray" padding="lg" id="receipts" border="bottom">
        <Container>
          <SectionHeader
            title="Receipts"
            description="This ties the bundle to a specific commit, CI run, and deployment."
          />
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card padding="sm">
              <CopyField
                label="Commit"
                value={formatCommitHash(evidence.commit.hash)}
                displayValue={formatCommitHash(evidence.commit.hash)}
                copyValue={evidence.commit.hash}
              />
              <div className="mt-2 text-body-xs text-neutral-600">
                Branch: <span className="font-mono text-neutral-900">{evidence.commit.branch}</span>
              </div>
            </Card>

            <Card padding="sm">
              <CopyField label="CI Run" value={evidence.ci.run_id} copyValue={evidence.ci.run_url} truncate />
              <a
                href={evidence.ci.run_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex text-body-xs font-medium text-primary-700 hover:text-primary-800"
              >
                Open run →
              </a>
            </Card>

            <Card padding="sm">
              <CopyField label="Deploy" value={evidence.deploy.url} truncate />
              <div className="mt-2 text-body-xs text-neutral-600">
                Channel: <span className="font-mono text-neutral-900">{evidence.deploy.channel}</span>
              </div>
            </Card>

            <Card padding="sm">
              <CopyField label="Generated At" value={formatTimestamp(evidence.generated_at)} copyValue={evidence.generated_at} />
              <div className="mt-2 text-body-xs text-neutral-600">
                Builder: <span className="font-mono text-neutral-900">{evidence.builder}</span>
              </div>
            </Card>
          </div>
        </Container>
      </Section>

      {/* Pipeline health */}
      <Section background="white" padding="lg" id="pipeline-health" border="bottom">
        <Container>
          <SectionHeader
            title="Pipeline Health"
            description="Rollup status across all subsystems, plus concrete processing counts."
          />
          <div className="mt-8">
            <Card>
              <CardHeader action={<StatusPill status={ph.status} size="lg" />}>
                <CardTitle as="h2" className="text-display-sm">
                  Overall
                </CardTitle>
                <p className="mt-1 text-body-sm text-neutral-700">
                  <span className="font-medium text-neutral-900">Why:</span> {reasonSummary}
                </p>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <Metric label="Documents" value={ph.documents_total} size="sm" />
                  <Metric label="Fully Processed" value={ph.fully_processed} sublabel={ph.processing_rate} size="sm" />
                  <Metric
                    label="Retrieval"
                    value={rt.query_count > 0 ? `${rt.success_count}/${rt.query_count}` : '—'}
                    sublabel={rt.query_count > 0 ? `Pass ≥ ${rt.threshold}/${rt.query_count}` : 'Not run'}
                    size="sm"
                  />
                </dl>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(ph.subsystem_statuses).map(([name, status]) => (
                    <div key={name} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50/60 px-3 py-2">
                      <span className="text-body-sm font-medium text-neutral-900 capitalize">{name.replace('_', ' ')}</span>
                      <StatusPill status={status} size="sm" />
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <DetailsDisclosure
                    title="Details JSON"
                    description="Raw pipeline_health object (rendered only when expanded)."
                    json={ph}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>

      {/* Integrations */}
      <Section background="gray" padding="lg" id="integrations" border="bottom">
        <Container>
          <SectionHeader
            title="Integrations"
            description="Each card shows a status, a rationale, key metrics, and what would make it “Verified”."
          />

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card id="integration-google-oauth">
              <CardHeader action={<StatusPill status={integrations.google_oauth.status} />}>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-700"><KeyIcon /></span>
                  <CardTitle as="h3" className="text-display-sm">Google OAuth</CardTitle>
                </div>
                <p className="mt-1 text-body-sm text-neutral-700">{formatRationaleShort(integrations.google_oauth.rationale)}</p>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Metric label="Token Valid" value={integrations.google_oauth.token_valid ? 'Yes' : 'No'} size="sm" />
                  <Metric label="Scopes" value={integrations.google_oauth.scopes.length} sublabel="configured" size="sm" />
                  <Metric label="Last Connect" value={integrations.google_oauth.last_connect_at ? formatTimestamp(integrations.google_oauth.last_connect_at) : 'Never'} size="sm" />
                  <Metric label="Checked" value={formatTimestamp(integrations.google_oauth.checked_at)} size="sm" />
                </dl>

                <div className="mt-6">
                  <DetailsDisclosure
                    title="Details JSON"
                    description="google_oauth integration payload"
                    json={integrations.google_oauth}
                  />
                </div>

                <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4">
                  <div className="text-label font-semibold text-neutral-600">What would make this Verified?</div>
                  <CriteriaList
                    items={VerificationCriteria.google_oauth}
                    verified={integrations.google_oauth.status === 'verified'}
                  />
                </div>
              </CardContent>
            </Card>

            <Card id="integration-inngest">
              <CardHeader action={<StatusPill status={integrations.inngest.status} />}>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-700"><WorkflowIcon /></span>
                  <CardTitle as="h3" className="text-display-sm">Inngest</CardTitle>
                </div>
                <p className="mt-1 text-body-sm text-neutral-700">{formatRationaleShort(integrations.inngest.rationale)}</p>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Metric label="Env" value={integrations.inngest.env} size="sm" />
                  <Metric label="Recent Runs" value={integrations.inngest.last_run_ids.length} size="sm" />
                  <Metric label="Failures" value={integrations.inngest.recent_failures} size="sm" />
                  <Metric label="Last Success" value={integrations.inngest.last_success_at ? formatTimestamp(integrations.inngest.last_success_at) : 'Never'} size="sm" />
                </dl>

                <div className="mt-6">
                  <DetailsDisclosure
                    title="Details JSON"
                    description="inngest integration payload"
                    json={integrations.inngest}
                  />
                </div>

                <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4">
                  <div className="text-label font-semibold text-neutral-600">What would make this Verified?</div>
                  <CriteriaList
                    items={VerificationCriteria.inngest}
                    verified={integrations.inngest.status === 'verified'}
                  />
                </div>
              </CardContent>
            </Card>

            <Card id="integration-nightfall">
              <CardHeader action={<StatusPill status={integrations.nightfall.status} />}>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-700"><ShieldIcon /></span>
                  <CardTitle as="h3" className="text-display-sm">Nightfall DLP</CardTitle>
                </div>
                <p className="mt-1 text-body-sm text-neutral-700">{formatRationaleShort(integrations.nightfall.rationale)}</p>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Metric label="Policy" value={integrations.nightfall.policy_name} size="sm" />
                  <Metric label="Allowed" value={integrations.nightfall.last_scan_counts.allowed} size="sm" />
                  <Metric label="Redacted" value={integrations.nightfall.last_scan_counts.redacted} size="sm" />
                  <Metric label="Quarantined" value={integrations.nightfall.last_scan_counts.quarantined} size="sm" />
                </dl>

                <div className="mt-6">
                  <DetailsDisclosure
                    title="Details JSON"
                    description="nightfall integration payload"
                    json={integrations.nightfall}
                  />
                </div>

                <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4">
                  <div className="text-label font-semibold text-neutral-600">What would make this Verified?</div>
                  <CriteriaList
                    items={VerificationCriteria.nightfall}
                    verified={integrations.nightfall.status === 'verified'}
                  />
                </div>
              </CardContent>
            </Card>

            <Card id="integration-supabase">
              <CardHeader action={<StatusPill status={integrations.supabase.status} />}>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-700"><DatabaseIcon /></span>
                  <CardTitle as="h3" className="text-display-sm">Supabase</CardTitle>
                </div>
                <p className="mt-1 text-body-sm text-neutral-700">{formatRationaleShort(integrations.supabase.rationale)}</p>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Metric label="Documents" value={integrations.supabase.document_count} size="sm" />
                  <Metric label="Vectors" value={integrations.supabase.vector_count} size="sm" />
                  <Metric label="Schema" value={integrations.supabase.schema_version} size="sm" />
                  <Metric label="RLS" value={integrations.supabase.rls_verified ? 'Verified' : 'Not verified'} size="sm" />
                </dl>

                <div className="mt-6">
                  <DetailsDisclosure
                    title="Details JSON"
                    description="supabase integration payload"
                    json={integrations.supabase}
                  />
                </div>

                <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4">
                  <div className="text-label font-semibold text-neutral-600">What would make this Verified?</div>
                  <CriteriaList
                    items={VerificationCriteria.supabase}
                    verified={integrations.supabase.status === 'verified'}
                  />
                </div>
              </CardContent>
            </Card>

            <Card id="integration-embeddings">
              <CardHeader action={<StatusPill status={integrations.embeddings.status} />}>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-700"><SearchIcon /></span>
                  <CardTitle as="h3" className="text-display-sm">Embeddings</CardTitle>
                </div>
                <p className="mt-1 text-body-sm text-neutral-700">{formatRationaleShort(integrations.embeddings.rationale)}</p>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Metric label="Vectors" value={integrations.embeddings.vector_count} size="sm" />
                  <Metric label="Last Index" value={integrations.embeddings.last_index_at ? formatTimestamp(integrations.embeddings.last_index_at) : 'Never'} size="sm" />
                  <Metric label="Retrieval" value={retrievalHeadline} sublabel={rt.query_count > 0 ? `Pass ≥ ${rt.threshold}/${rt.query_count}` : 'Not run'} size="sm" />
                  <Metric label="Top‑K" value={rt.top_k} size="sm" />
                </dl>

                <div className="mt-6">
                  <DetailsDisclosure
                    title="Details JSON"
                    description="embeddings integration payload"
                    json={integrations.embeddings}
                  />
                </div>

                <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4">
                  <div className="text-label font-semibold text-neutral-600">What would make this Verified?</div>
                  <CriteriaList
                    items={VerificationCriteria.embeddings}
                    verified={integrations.embeddings.status === 'verified'}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>

      {/* Retrieval Test */}
      <Section background="white" padding="lg" id="retrieval-test" border="bottom">
        <Container>
          <SectionHeader
            title="Retrieval Test"
            description="Proves semantic retrieval returns real results with provenance."
          />

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5">
              <Card>
                <CardHeader action={<StatusPill status={integrations.embeddings.status} />}>
                  <CardTitle as="h2" className="text-display-sm">Result</CardTitle>
                  <p className="mt-1 text-body-sm text-neutral-700">{retrievalCriteria}</p>
                </CardHeader>
                <CardContent>
                  <div className="text-metric-lg font-bold text-neutral-900">{retrievalHeadline}</div>
                  <div className="mt-3 text-body-sm text-neutral-700">
                    Failures: {rt.failures.no_results} no results, {rt.failures.errors} errors
                  </div>
                  {!rt.passed && rt.query_count > 0 && (
                    <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
                      <div className="text-label font-semibold text-neutral-600">Top failure reasons</div>
                      <ul className="mt-3 space-y-2 text-body-sm text-neutral-700">
                        {rt.failures.no_results > 0 && (
                          <li className="flex gap-2">
                            <span className="text-neutral-500">•</span>
                            <span>
                              No results ({rt.failures.no_results}). Check{' '}
                              <a href="#integration-embeddings" className="text-primary-700 hover:text-primary-800 font-medium">
                                Embeddings
                              </a>{' '}
                              and{' '}
                              <a href="#integration-supabase" className="text-primary-700 hover:text-primary-800 font-medium">
                                Supabase
                              </a>.
                            </span>
                          </li>
                        )}
                        {rt.failures.errors > 0 && (
                          <li className="flex gap-2">
                            <span className="text-neutral-500">•</span>
                            <span>
                              Errors ({rt.failures.errors}). Check credentials and network access.
                            </span>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-7">
              <Table<RetrievalRow>
                data={retrievalRows}
                rowKey={(r, idx) => `${r.query}-${r.doc_id}-${idx}`}
                emptyState="No sample queries recorded yet."
                columns={[
                  { key: 'query', header: 'Query', cell: (r) => <span className="text-neutral-900">{r.query}</span> },
                  { key: 'doc', header: 'doc_id', cell: (r) => <span className="font-mono text-neutral-900">{r.doc_id}</span> },
                  { key: 'chunk', header: 'chunk_id', cell: (r) => <span className="font-mono text-neutral-900">{r.chunk_id}</span> },
                  { key: 'score', header: 'score', align: 'right', cell: (r) => <span className="font-mono text-neutral-900">{r.score.toFixed(3)}</span> },
                ]}
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* Data consistency */}
      <Section background="gray" padding="lg" id="data-consistency">
        <Container>
          <SectionHeader
            title="Data Consistency"
            description="A small reconciliation view across documents, chunks, vectors, and last indexed."
          />

          <div className="mt-8">
            <Table
              data={[
                {
                  documents: integrations.supabase.document_count,
                  chunks: integrations.supabase.chunk_count,
                  vectors_supabase: integrations.supabase.vector_count,
                  vectors_embeddings: integrations.embeddings.vector_count,
                  last_indexed_at: integrations.embeddings.last_index_at,
                },
              ]}
              rowKey={() => 'consistency'}
              columns={[
                { key: 'documents', header: 'documents', align: 'right', cell: (r) => <span className="font-mono">{r.documents.toLocaleString()}</span> },
                { key: 'chunks', header: 'chunks', align: 'right', cell: (r) => <span className="font-mono">{r.chunks.toLocaleString()}</span> },
                {
                  key: 'vectors',
                  header: 'vectors',
                  align: 'right',
                  cell: (r) => (
                    <span className="font-mono">
                      {r.vectors_embeddings.toLocaleString()}
                      <span className="text-neutral-600"> (emb)</span> / {r.vectors_supabase.toLocaleString()}
                      <span className="text-neutral-600"> (db)</span>
                    </span>
                  ),
                },
                {
                  key: 'last_indexed_at',
                  header: 'last_indexed_at',
                  cell: (r) => (
                    <span className="font-mono">
                      {r.last_indexed_at ? formatTimestamp(r.last_indexed_at) : 'Never'}
                    </span>
                  ),
                },
              ]}
            />

            {(vectorMismatch || chunkVectorMismatch) && (
              <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="text-label font-semibold text-neutral-600">Notes</div>
                <ul className="mt-3 space-y-2 text-body-sm text-neutral-700">
                  {vectorMismatch && (
                    <li className="flex gap-2">
                      <span className="text-neutral-500">•</span>
                      <span>
                        Vector mismatch: Supabase reports {integrations.supabase.vector_count} vectors but Embeddings reports {integrations.embeddings.vector_count}.
                      </span>
                    </li>
                  )}
                  {chunkVectorMismatch && (
                    <li className="flex gap-2">
                      <span className="text-neutral-500">•</span>
                      <span>
                        Chunk/vector mismatch: chunks={integrations.supabase.chunk_count}, vectors={integrations.supabase.vector_count}. This can indicate partial indexing or a stale embedding job.
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </Container>
      </Section>
    </BaseLayout>
  );
}
