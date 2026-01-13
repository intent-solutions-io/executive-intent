import { loadEvidenceSync, getPlaceholderEvidence } from '@/lib/evidence/loadEvidence';
import { ProofStepper } from '@/components/proof/ProofStepper';
import { BaseLayout } from '@/components/layout';
import { Section, Container, Button, StatusPill } from '@/components/ui';

export const metadata = {
  title: 'Proof Walkthrough | Executive Intent',
  description: 'Step-by-step verification of Executive Intent integrations',
};

export default function ProofPage() {
  const evidence = loadEvidenceSync() || getPlaceholderEvidence();

  return (
    <BaseLayout currentPath="/proof" evidenceGeneratedAt={evidence.generated_at}>
      <Section background="white" padding="xl" border="bottom">
        <Container>
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <StatusPill status={evidence.pipeline_health.status} />
              <Button href="/evidence" variant="ghost" size="sm">
                View Evidence →
              </Button>
            </div>
            <h1 className="mt-5 text-display-lg md:text-display-xl font-semibold text-neutral-900 tracking-tight">
              Proof Walkthrough
            </h1>
            <p className="mt-4 text-body-xl text-neutral-700 max-w-prose-wide">
              A step-by-step verification path. Each step tells you what to do, what you should see,
              and links directly to the corresponding receipt in the evidence bundle.
            </p>
          </div>
        </Container>
      </Section>

      <Section background="gray" padding="xl">
        <Container>
          <ProofStepper evidence={evidence} />
        </Container>
      </Section>
    </BaseLayout>
  );
}
