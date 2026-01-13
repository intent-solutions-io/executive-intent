import Link from 'next/link';
import { loadEvidenceSync, getPlaceholderEvidence } from '@/lib/evidence/loadEvidence';
import { EvidenceCards } from '@/components/proof/EvidenceCards';
import { formatTimestamp, formatCommitHash } from '@/lib/evidence/format';
import { BaseLayout } from '@/components/layout';
import { Section, Container, SectionHeader, Button, StatusPill, Card, CardContent } from '@/components/ui';

// Feature list for "What's Built" section
const FEATURES = [
  { text: 'Google OAuth connection (Gmail + Calendar)', done: true },
  { text: 'Incremental ingestion orchestration (Inngest)', done: true },
  { text: 'Nightfall DLP enforcement (allow/redact/quarantine)', done: true },
  { text: 'Embeddings in Supabase pgvector', done: true },
  { text: 'Retrieval verification (vector query)', done: true },
  { text: 'Audit trail + retention hooks', done: true },
];

// Trust strip items
function TrustStrip({ evidence }: { evidence: ReturnType<typeof getPlaceholderEvidence> }) {
  const items = [
    { label: 'Commit', value: formatCommitHash(evidence.commit.hash), mono: true },
    { label: 'CI Run', value: evidence.ci.run_id, link: evidence.ci.run_url, mono: true },
    { label: 'Deploy', value: evidence.deploy.site, link: evidence.deploy.url, mono: true },
    { label: 'Generated', value: formatTimestamp(evidence.generated_at), mono: false },
  ];

  return (
    <Section background="gray" padding="sm" border="both">
      <Container>
        <div className="flex flex-wrap justify-center gap-6 md:gap-12">
          {items.map(({ label, value, link, mono }) => (
            <div key={label} className="text-center">
              <div className="text-label text-neutral-500 mb-1">{label}</div>
              {link ? (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-primary-600 hover:text-primary-700 hover:underline ${mono ? 'font-mono' : ''} text-body-sm font-medium`}
                >
                  {value}
                </a>
              ) : (
                <div className={`text-neutral-900 ${mono ? 'font-mono' : ''} text-body-sm font-medium`}>
                  {value}
                </div>
              )}
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export default function Home() {
  const evidence = loadEvidenceSync() || getPlaceholderEvidence();
  const pipelineStatus = evidence.pipeline_health.status;

  return (
    <BaseLayout currentPath="/">
      {/* Hero Section */}
      <Section background="white" padding="xl">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            {/* Status badge */}
            <div className="flex justify-center mb-6">
              <StatusPill status={pipelineStatus} size="lg" />
            </div>

            {/* Headline */}
            <h1 className="text-display-xl md:text-display-2xl font-bold text-neutral-900 text-balance">
              Executive Intent
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-body-xl text-neutral-600 max-w-2xl mx-auto text-balance">
              Your inbox + calendar, organized for decisions. Gmail + Calendar &rarr; Nightfall DLP &rarr; pgvector search, orchestrated by Inngest.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Button href="/proof" variant="primary" size="lg">
                View Proof
              </Button>
              <Button href="/evidence" variant="outline" size="lg">
                Evidence Bundle
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      {/* Trust Strip - Receipt chain */}
      <TrustStrip evidence={evidence} />

      {/* What's Built Section */}
      <Section background="dark" padding="lg">
        <Container size="md">
          <SectionHeader
            title="What's Built"
            description="End-to-end data pipeline with enterprise-grade security"
            centered
          />
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ text, done }) => (
              <div key={text} className="flex items-start gap-3 text-neutral-300">
                <span className={`mt-0.5 ${done ? 'text-green-400' : 'text-neutral-500'}`}>
                  {done ? '✓' : '○'}
                </span>
                <span className="text-body-md">{text}</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Pipeline Status Section */}
      <Section background="white" padding="lg">
        <Container>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
            <SectionHeader
              title="Integration Status"
              description="Real-time verification of all system integrations"
            />
            <Link
              href="/evidence"
              className="text-primary-600 hover:text-primary-700 text-body-sm font-medium inline-flex items-center gap-1 group"
            >
              View full evidence bundle
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <EvidenceCards evidence={evidence} />
        </Container>
      </Section>

      {/* How It Works - Simple timeline */}
      <Section background="gray" padding="lg" border="top">
        <Container size="md">
          <SectionHeader
            title="How It Works"
            description="From inbox to insight in four verified steps"
            centered
          />
          <div className="mt-12 relative">
            {/* Timeline line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-neutral-300 -translate-x-1/2" />

            {/* Steps */}
            <div className="space-y-12 md:space-y-16">
              {[
                {
                  step: 1,
                  title: 'Connect',
                  desc: 'OAuth to Gmail + Calendar. Your credentials, encrypted at rest.',
                  icon: '🔐',
                },
                {
                  step: 2,
                  title: 'Ingest',
                  desc: 'Inngest orchestrates incremental sync. Only new data, no duplicates.',
                  icon: '📥',
                },
                {
                  step: 3,
                  title: 'Protect',
                  desc: 'Nightfall DLP scans everything. PII is redacted or quarantined.',
                  icon: '🛡️',
                },
                {
                  step: 4,
                  title: 'Search',
                  desc: 'pgvector embeddings enable semantic search. Find what matters.',
                  icon: '🔍',
                },
              ].map(({ step, title, desc, icon }, idx) => (
                <div
                  key={step}
                  className={`relative flex flex-col md:flex-row items-center gap-6 ${
                    idx % 2 === 1 ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  {/* Content */}
                  <div className={`flex-1 ${idx % 2 === 1 ? 'md:text-right' : ''}`}>
                    <Card hover padding="md" className="inline-block max-w-sm">
                      <CardContent className="!mt-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{icon}</span>
                          <h3 className="text-display-xs font-semibold text-neutral-900">{title}</h3>
                        </div>
                        <p className="text-body-md text-neutral-600">{desc}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Step number */}
                  <div className="relative z-10 w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                    {step}
                  </div>

                  {/* Spacer for alignment */}
                  <div className="flex-1 hidden md:block" />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Final CTA */}
      <Section background="white" padding="lg" border="top">
        <Container size="sm">
          <div className="text-center">
            <h2 className="text-display-sm font-bold text-neutral-900">
              See the receipts
            </h2>
            <p className="mt-3 text-body-lg text-neutral-600">
              Every integration verified. Every step auditable.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Button href="/proof" variant="primary" size="lg">
                View Proof
              </Button>
              <Button
                href={`https://github.com/intent-solutions-io/executive-intent/commit/${evidence.commit.hash}`}
                variant="ghost"
                size="lg"
                external
                icon={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                }
              >
                View on GitHub
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </BaseLayout>
  );
}
