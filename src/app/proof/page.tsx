import Link from 'next/link';
import { loadEvidenceSync, getPlaceholderEvidence } from '@/lib/evidence/loadEvidence';
import { ProofStepper } from '@/components/proof/ProofStepper';
import { formatTimestamp, formatCommitHash } from '@/lib/evidence/format';
import { BaseLayout } from '@/components/layout';
import { Section, Container, SectionHeader, Button, StatusPill } from '@/components/ui';

export const metadata = {
  title: 'Proof Walkthrough | Executive Intent',
  description: 'Step-by-step verification of Executive Intent integrations',
};

export default function ProofPage() {
  const evidence = loadEvidenceSync() || getPlaceholderEvidence();

  return (
    <BaseLayout currentPath="/proof">
      {/* Header */}
      <Section background="white" padding="lg" border="bottom">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-4">
              <StatusPill status={evidence.pipeline_health.status} size="lg" />
            </div>
            <h1 className="text-display-lg font-bold text-neutral-900">Proof Walkthrough</h1>
            <p className="mt-4 text-body-lg text-neutral-600">
              Follow the evidence chain verifying each integration.
              Each step links to verifiable artifacts in the evidence bundle.
            </p>

            {/* Status Legend */}
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-body-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-neutral-600">Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-neutral-600">Processing / Connected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-neutral-400" />
                <span className="text-neutral-600">Configured</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-neutral-600">Degraded</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-neutral-600">Error</span>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Build Info Strip */}
      <Section background="dark" padding="sm">
        <Container>
          <div className="flex flex-wrap justify-center gap-8 text-body-sm">
            <div>
              <span className="text-neutral-400">Commit:</span>{' '}
              <a
                href={`https://github.com/intent-solutions-io/executive-intent/commit/${evidence.commit.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-primary-400 hover:underline"
              >
                {formatCommitHash(evidence.commit.hash)}
              </a>
            </div>
            <div>
              <span className="text-neutral-400">Branch:</span>{' '}
              <span className="font-medium text-white">{evidence.commit.branch}</span>
            </div>
            <div>
              <span className="text-neutral-400">Generated:</span>{' '}
              <span className="font-medium text-white">{formatTimestamp(evidence.generated_at)}</span>
            </div>
          </div>
        </Container>
      </Section>

      {/* Proof Stepper */}
      <Section background="gray" padding="xl">
        <Container>
          <ProofStepper evidence={evidence} />
        </Container>
      </Section>

      {/* Evidence Link */}
      <Section background="white" padding="lg" border="top">
        <Container size="sm">
          <div className="text-center">
            <h2 className="text-display-xs font-semibold text-neutral-900">
              Want the raw evidence?
            </h2>
            <p className="mt-3 text-body-md text-neutral-600">
              Download the complete machine-readable evidence bundle for independent verification.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Button href="/evidence" variant="primary">
                View Evidence Bundle
              </Button>
              <Button
                href="/evidence/evidence.json"
                variant="outline"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              >
                Download JSON
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </BaseLayout>
  );
}
