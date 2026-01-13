import { loadEvidenceSync, getPlaceholderEvidence } from '@/lib/evidence/loadEvidence';
import { formatCommitHash, formatTimestamp } from '@/lib/evidence/format';
import { VerificationCriteria } from '@/lib/evidence/types';
import { BaseLayout } from '@/components/layout';
import { Button, Card, CardContent, CardHeader, CardTitle, Container, CopyField, Metric, Section, SectionHeader, StatusPill } from '@/components/ui';

function getEvidenceUrl(baseUrl: string, path: string) {
  try {
    return new URL(path, baseUrl).toString();
  } catch {
    return path;
  }
}

function getStatusNote(status: string) {
  switch (status) {
    case 'verified':
      return 'Meets verification criteria.';
    case 'processing':
      return 'Actively processing; check evidence for progress.';
    case 'connected':
      return 'Connection observed; awaiting end-to-end thresholds.';
    case 'configured':
      return 'Configured; no live connection observed yet.';
    case 'degraded':
      return 'Partial failure or inconsistent signals; investigate.';
    case 'error':
      return 'Hard failure; blocked until resolved.';
    default:
      return 'Unknown status.';
  }
}

export default function Home() {
  const evidence = loadEvidenceSync() || getPlaceholderEvidence();
  const ph = evidence.pipeline_health;
  const rt = evidence.integrations.embeddings.retrieval_test;

  const evidenceJsonUrl = getEvidenceUrl(evidence.deploy.url, '/evidence/evidence.json');
  const evidenceMdUrl = getEvidenceUrl(evidence.deploy.url, '/evidence/evidence.md');

  const howItWorks = [
    {
      title: 'Connect',
      description: 'OAuth to Gmail + Calendar.',
      status: evidence.integrations.google_oauth.status,
    },
    {
      title: 'Ingest',
      description: 'Incremental sync orchestrated by Inngest.',
      status: evidence.integrations.inngest.status,
    },
    {
      title: 'DLP',
      description: 'Nightfall scans; allow, redact, or quarantine.',
      status: evidence.integrations.nightfall.status,
    },
    {
      title: 'Index',
      description: 'Embeddings stored in Supabase pgvector.',
      status: evidence.integrations.supabase.status,
    },
    {
      title: 'Retrieve',
      description: 'Vector queries validated by retrieval tests.',
      status: evidence.integrations.embeddings.status,
    },
  ] as const;

  const integrations = [
    { key: 'google_oauth', label: 'Google OAuth', status: evidence.integrations.google_oauth.status },
    { key: 'inngest', label: 'Inngest', status: evidence.integrations.inngest.status },
    { key: 'nightfall', label: 'Nightfall DLP', status: evidence.integrations.nightfall.status },
    { key: 'supabase', label: 'Supabase', status: evidence.integrations.supabase.status },
    { key: 'embeddings', label: 'Embeddings + Retrieval', status: evidence.integrations.embeddings.status },
  ] as const;

  const verified = integrations.filter((i) => i.status === 'verified');
  const configured = integrations.filter((i) => i.status !== 'verified');

  return (
    <BaseLayout currentPath="/" evidenceGeneratedAt={evidence.generated_at}>
      {/* Hero */}
      <Section background="white" padding="xl" border="bottom">
        <Container>
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-3">
                <StatusPill status={ph.status} />
                <span className="text-body-sm text-neutral-600">
                  Evidence generated {formatTimestamp(evidence.generated_at)}
                </span>
              </div>

              <h1 className="mt-5 text-display-lg md:text-display-2xl font-semibold text-neutral-900 tracking-tight text-balance">
                Executive Intent
              </h1>
              <p className="mt-4 text-body-xl text-neutral-700 max-w-prose-wide">
                Proof-first pipeline from Gmail/Calendar → DLP → Vector store → Retrieval.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button href="/evidence" variant="primary" size="lg" className="w-full sm:w-auto">
                  View Evidence
                </Button>
                <Button href="/proof" variant="outline" size="lg" className="w-full sm:w-auto">
                  View Proof Walkthrough
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <Card>
                <CardHeader
                  className="items-start"
                  action={<StatusPill status={ph.status} size="sm" />}
                >
                  <CardTitle as="h2" className="text-display-sm">
                    System Status
                  </CardTitle>
                  <p className="mt-1 text-body-sm text-neutral-600">
                    Pipeline health and key signals from the evidence bundle.
                  </p>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <Metric label="Documents" value={ph.documents_total} size="sm" />
                    <Metric label="Processed" value={ph.fully_processed} sublabel={ph.processing_rate} size="sm" />
                    <Metric
                      label="Retrieval"
                      value={rt.query_count > 0 ? `${rt.success_count}/${rt.query_count}` : '—'}
                      sublabel={rt.query_count > 0 ? `Pass ≥ ${rt.threshold}/${rt.query_count}` : 'Not run'}
                      size="sm"
                    />
                  </dl>
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </Section>

      {/* Trust Strip */}
      <Section background="gray" padding="md" border="bottom">
        <Container>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card padding="sm">
              <CopyField
                label="Commit"
                value={formatCommitHash(evidence.commit.hash)}
                copyValue={evidence.commit.hash}
                displayValue={formatCommitHash(evidence.commit.hash)}
              />
              <div className="mt-2 text-body-xs text-neutral-600">
                Branch: <span className="font-mono text-neutral-900">{evidence.commit.branch}</span>
              </div>
            </Card>

            <Card padding="sm">
              <CopyField
                label="CI Run"
                value={evidence.ci.run_id}
                copyValue={evidence.ci.run_url}
                truncate
              />
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
              <CopyField label="Deploy URL" value={evidence.deploy.url} truncate />
              <div className="mt-2 text-body-xs text-neutral-600">
                Channel: <span className="font-mono text-neutral-900">{evidence.deploy.channel}</span>
              </div>
            </Card>

            <Card padding="sm">
              <CopyField label="Evidence Bundle" value={evidenceJsonUrl} truncate />
              <div className="mt-2 flex gap-3">
                <a
                  href={evidenceJsonUrl}
                  className="text-body-xs font-medium text-primary-700 hover:text-primary-800"
                >
                  Download JSON
                </a>
                <a
                  href={evidenceMdUrl}
                  className="text-body-xs font-medium text-primary-700 hover:text-primary-800"
                >
                  Download MD
                </a>
              </div>
            </Card>
          </div>
        </Container>
      </Section>

      {/* How It Works */}
      <Section background="white" padding="lg" border="bottom">
        <Container>
          <SectionHeader
            title="How It Works"
            description="Connect → Ingest → DLP → Index → Retrieve — each step is statused from real evidence."
            actions={
              <Button href="/proof" variant="ghost" size="md">
                Walkthrough →
              </Button>
            }
          />

          <div className="mt-8">
            <div className="md:hidden -mx-4 px-4 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {howItWorks.map((s) => (
                <Card key={s.title} padding="sm" className="min-w-64">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-body-md font-semibold text-neutral-900">{s.title}</div>
                      <p className="mt-2 text-body-sm text-neutral-700">{s.description}</p>
                    </div>
                    <StatusPill status={s.status} size="sm" showIcon={false} />
                  </div>
                </Card>
              ))}
            </div>

            <div className="hidden md:grid md:grid-cols-5 gap-4">
              {howItWorks.map((s) => (
                <Card key={s.title} padding="sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-body-md font-semibold text-neutral-900">{s.title}</div>
                      <p className="mt-2 text-body-sm text-neutral-700">{s.description}</p>
                    </div>
                    <StatusPill status={s.status} size="sm" showIcon={false} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Verified vs Configured */}
      <Section background="gray" padding="lg">
        <Container>
          <SectionHeader
            title="What’s Verified vs What’s Configured"
            description="Brutally honest status: verified means the evidence meets defined criteria — everything else is still in progress."
          />

          <div className="mt-8 grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle as="h3" className="text-display-sm">
                  Verified
                </CardTitle>
              </CardHeader>
              <CardContent className="!mt-0">
                {verified.length === 0 ? (
                  <p className="text-body-sm text-neutral-600">
                    Nothing is verified yet. See the checklist on the evidence page for what’s needed.
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {verified.map((i) => (
                      <li key={i.key} className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-body-md font-medium text-neutral-900">{i.label}</div>
                          <div className="mt-1 text-body-sm text-neutral-600">{getStatusNote(i.status)}</div>
                        </div>
                        <StatusPill status={i.status} size="sm" />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle as="h3" className="text-display-sm">
                  Configured / In Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="!mt-0">
                <ul className="space-y-4">
                  {configured.map((i) => (
                    <li key={i.key} className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-body-md font-medium text-neutral-900">{i.label}</div>
                        <div className="mt-1 text-body-sm text-neutral-600">{getStatusNote(i.status)}</div>
                        <div className="mt-2 text-body-xs text-neutral-600">
                          To verify:{' '}
                          <span className="text-neutral-800">
                            {VerificationCriteria[i.key as keyof typeof VerificationCriteria]?.[0] ?? 'See evidence'}
                          </span>
                        </div>
                      </div>
                      <StatusPill status={i.status} size="sm" />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>
    </BaseLayout>
  );
}
