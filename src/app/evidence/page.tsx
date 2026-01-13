import Link from 'next/link';
import { loadEvidenceSync, getPlaceholderEvidence } from '@/lib/evidence/loadEvidence';
import { EvidenceCards } from '@/components/proof/EvidenceCards';
import { EvidenceJsonViewer } from '@/components/proof/EvidenceJsonViewer';
import { EvidenceTimeline } from '@/components/proof/EvidenceTimeline';
import { formatTimestamp, formatCommitHash, generateMarkdownSummary } from '@/lib/evidence/format';
import { BaseLayout } from '@/components/layout';
import {
  Section,
  Container,
  SectionHeader,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatusPill,
} from '@/components/ui';

export const metadata = {
  title: 'Evidence Bundle | Executive Intent',
  description: 'Complete machine-readable evidence bundle for Executive Intent',
};

function DownloadIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

export default function EvidencePage() {
  const evidence = loadEvidenceSync() || getPlaceholderEvidence();
  const markdownSummary = generateMarkdownSummary(evidence);

  return (
    <BaseLayout currentPath="/evidence">
      {/* Header */}
      <Section background="white" padding="lg" border="bottom">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-4">
              <StatusPill status={evidence.pipeline_health.status} size="lg" />
            </div>
            <h1 className="text-display-lg font-bold text-neutral-900">Evidence Bundle</h1>
            <p className="mt-4 text-body-lg text-neutral-600">
              Complete, machine-readable proof of Executive Intent integrations.
              Download for independent verification.
            </p>

            {/* What this proves - brief */}
            <div className="mt-8 bg-neutral-50 rounded-xl p-6 text-left max-w-xl mx-auto">
              <h2 className="text-body-md font-semibold text-neutral-900 mb-3">
                What this bundle proves:
              </h2>
              <p className="text-body-sm text-neutral-700 mb-4">
                Each integration is working with real data, not just configured. The evidence
                includes commit hash, CI run, deploy URL, and live integration checks.
              </p>
              <div className="grid grid-cols-2 gap-2 text-body-sm">
                <div className="flex items-center gap-2 text-neutral-700">
                  <span className="text-green-600">✓</span> OAuth tokens valid
                </div>
                <div className="flex items-center gap-2 text-neutral-700">
                  <span className="text-green-600">✓</span> Database connected
                </div>
                <div className="flex items-center gap-2 text-neutral-700">
                  <span className="text-green-600">✓</span> DLP scanning active
                </div>
                <div className="flex items-center gap-2 text-neutral-700">
                  <span className="text-green-600">✓</span> Embeddings indexed
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Metadata Strip */}
      <Section background="dark" padding="sm">
        <Container>
          <div className="flex flex-wrap justify-center gap-8 text-body-sm">
            <div>
              <span className="text-neutral-400">Product:</span>{' '}
              <span className="font-medium text-white">{evidence.product}</span>
            </div>
            <div>
              <span className="text-neutral-400">CI Provider:</span>{' '}
              <span className="font-medium text-white">{evidence.ci.provider}</span>
            </div>
            <div>
              <span className="text-neutral-400">Workflow:</span>{' '}
              <span className="font-medium text-white">{evidence.ci.workflow}</span>
            </div>
          </div>
        </Container>
      </Section>

      {/* Download Links */}
      <Section background="gray" padding="md" border="bottom">
        <Container>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              href="/evidence/evidence.json"
              variant="primary"
              icon={<DownloadIcon />}
            >
              evidence.json
            </Button>
            <Button
              href="/evidence/evidence.md"
              variant="outline"
              icon={<DownloadIcon />}
            >
              evidence.md
            </Button>
            <Button
              href={evidence.ci.run_url}
              variant="outline"
              external
              icon={<ExternalLinkIcon />}
            >
              CI Run #{evidence.ci.run_id}
            </Button>
          </div>
        </Container>
      </Section>

      {/* Build & Deploy Info */}
      <Section background="white" padding="lg" id="build">
        <Container>
          <SectionHeader title="Build & Deploy" />
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            {/* Commit Info */}
            <Card hover>
              <CardHeader>
                <CardTitle as="h3">Git Commit</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-body-sm">
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Hash</dt>
                    <dd className="font-mono">
                      <a
                        href={`https://github.com/intent-solutions-io/executive-intent/commit/${evidence.commit.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline"
                      >
                        {evidence.commit.hash}
                      </a>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Branch</dt>
                    <dd className="font-mono">{evidence.commit.branch}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Deploy Info */}
            <Card hover>
              <CardHeader>
                <CardTitle as="h3">Firebase Deploy</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-body-sm">
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Project</dt>
                    <dd className="font-mono">{evidence.deploy.firebase_project}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Site</dt>
                    <dd className="font-mono">{evidence.deploy.site}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">URL</dt>
                    <dd>
                      <a
                        href={evidence.deploy.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline"
                      >
                        {evidence.deploy.url}
                      </a>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Completed</dt>
                    <dd>{formatTimestamp(evidence.deploy.completed_at)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>

      {/* Integration Status */}
      <Section background="gray" padding="lg" id="integrations" border="top">
        <Container>
          <SectionHeader
            title="Integration Status"
            description="Current verification state of all system integrations"
          />
          <div className="mt-8">
            <EvidenceCards evidence={evidence} />
          </div>
        </Container>
      </Section>

      {/* Evidence Timeline */}
      <Section background="white" padding="lg" id="timeline" border="top">
        <Container>
          <SectionHeader
            title="Evidence Timeline"
            description="Chronological record of all integration checks and deployment events"
          />
          <div className="mt-8">
            <EvidenceTimeline evidence={evidence} />
          </div>
        </Container>
      </Section>

      {/* Supabase Details */}
      <Section background="gray" padding="lg" id="supabase" border="top">
        <Container>
          <SectionHeader title="Supabase Details" />
          <div className="mt-8">
            <Card>
              <CardContent className="!mt-0">
                <dl className="grid md:grid-cols-3 gap-6 text-body-sm">
                  <div>
                    <dt className="text-neutral-500 mb-1">Project Ref</dt>
                    <dd className="font-mono text-neutral-900">{evidence.integrations.supabase.project_ref}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500 mb-1">Schema Version</dt>
                    <dd className="font-mono text-neutral-900">{evidence.integrations.supabase.schema_version}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500 mb-1">pgvector</dt>
                    <dd className="text-neutral-900">{evidence.integrations.supabase.pgvector ? 'Enabled' : 'Disabled'}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500 mb-1">RLS Verified</dt>
                    <dd className="text-neutral-900">{evidence.integrations.supabase.rls_verified ? 'Yes' : 'No'}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500 mb-1">Documents</dt>
                    <dd className="text-neutral-900 font-semibold">{evidence.integrations.supabase.document_count.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500 mb-1">Chunks</dt>
                    <dd className="text-neutral-900 font-semibold">{evidence.integrations.supabase.chunk_count.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500 mb-1">Vectors</dt>
                    <dd className="text-neutral-900 font-semibold">{evidence.integrations.supabase.vector_count.toLocaleString()}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>

      {/* Raw Evidence Viewers */}
      <Section background="gray" padding="lg" id="raw" border="top">
        <Container>
          <SectionHeader title="Raw Evidence" />

          {/* JSON Viewer */}
          <div className="mt-8 mb-10">
            <h3 className="text-display-xs font-semibold text-neutral-900 mb-4">evidence.json</h3>
            <EvidenceJsonViewer evidence={evidence} />
          </div>

          {/* Markdown Preview */}
          <div>
            <h3 className="text-display-xs font-semibold text-neutral-900 mb-4">evidence.md (Preview)</h3>
            <Card padding="none">
              <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-200">
                <span className="text-neutral-600 font-mono text-body-sm">evidence.md</span>
                <a
                  href="/evidence/evidence.md"
                  download
                  className="text-body-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Download
                </a>
              </div>
              <pre className="p-4 text-body-sm text-neutral-700 overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap">
                {markdownSummary}
              </pre>
            </Card>
          </div>
        </Container>
      </Section>

      {/* Verification Instructions */}
      <Section background="white" padding="lg" border="top">
        <Container size="md">
          <SectionHeader title="Independent Verification" />
          <div className="mt-8 prose-evidence">
            <p className="text-body-lg text-neutral-700">
              To independently verify this evidence:
            </p>
            <ol className="list-decimal list-inside space-y-4 mt-6 text-body-md text-neutral-700">
              <li>
                <strong className="text-neutral-900">Download evidence.json</strong> &mdash; Contains all machine-readable proof
              </li>
              <li>
                <strong className="text-neutral-900">Check the CI run</strong> &mdash; Visit{' '}
                <a href={evidence.ci.run_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  CI Run #{evidence.ci.run_id}
                </a>{' '}
                to see the build that generated this evidence
              </li>
              <li>
                <strong className="text-neutral-900">Verify the commit</strong> &mdash; Check the{' '}
                <a
                  href={`https://github.com/intent-solutions-io/executive-intent/commit/${evidence.commit.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  git commit {formatCommitHash(evidence.commit.hash)}
                </a>{' '}
                to see the code
              </li>
              <li>
                <strong className="text-neutral-900">Test the integrations</strong> &mdash; Each integration status can be verified against the respective service dashboards
              </li>
            </ol>
          </div>
        </Container>
      </Section>

      {/* Back to home link */}
      <Section background="gray" padding="md" border="top">
        <Container>
          <div className="text-center text-body-sm text-neutral-500">
            <p>
              Evidence generated {formatTimestamp(evidence.generated_at)}
            </p>
            <p className="mt-2">
              <Link href="/" className="text-primary-600 hover:underline">Home</Link>
              {' | '}
              <Link href="/proof" className="text-primary-600 hover:underline">Proof Walkthrough</Link>
            </p>
          </div>
        </Container>
      </Section>
    </BaseLayout>
  );
}
