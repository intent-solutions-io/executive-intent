'use client';

import { cn } from '@/lib/utils';
import { EvidenceBundle, IntegrationStatus } from '@/lib/evidence/types';
import { formatCommitHash } from '@/lib/evidence/format';
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, DetailsDisclosure, StatusPill } from '@/components/ui';

interface ProofStep {
  id: string;
  title: string;
  status: IntegrationStatus;
  do: string[];
  see: string[];
  evidenceHref: string;
  why?: string;
}

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function ProofStepper({ evidence }: { evidence: EvidenceBundle }) {
  const steps = useMemo<ProofStep[]>(() => {
    const retrieval = evidence.integrations.embeddings.retrieval_test;
    const retrievalStr =
      retrieval.query_count > 0 ? `${retrieval.success_count}/${retrieval.query_count}` : 'Not run';

    return [
      {
        id: 'step-receipts',
        title: 'Receipts (Build Provenance)',
        status: evidence.pipeline_health.status,
        evidenceHref: '/evidence#receipts',
        do: [
          'Open the Evidence page and inspect the receipts row.',
          'Confirm the commit hash and CI run link match the deployed site.',
        ],
        see: [
          `Commit: ${formatCommitHash(evidence.commit.hash)} (${evidence.commit.branch})`,
          `Deploy URL: ${evidence.deploy.url}`,
        ],
        why: 'Receipts establish provenance: a reviewer can tie every claim back to a specific commit, CI run, and deployment target.',
      },
      {
        id: 'step-oauth',
        title: 'Google OAuth (Source Access)',
        status: evidence.integrations.google_oauth.status,
        evidenceHref: '/evidence#integration-google-oauth',
        do: [
          'Check configured scopes and the last connection timestamp.',
          'Confirm the status is not green unless a live API call is proven.',
        ],
        see: [
          'Scopes listed and last connection time present (or “Never” if not connected).',
          'A clear rationale explaining why it is connected/verified vs only configured.',
        ],
        why: 'OAuth is the root of trust for inbox/calendar data. Proof here prevents “configured ≠ working” demos.',
      },
      {
        id: 'step-inngest',
        title: 'Inngest (Orchestration)',
        status: evidence.integrations.inngest.status,
        evidenceHref: '/evidence#integration-inngest',
        do: [
          'Review recent run IDs and the last successful run timestamp.',
          'If there are failures, confirm they are reported explicitly.',
        ],
        see: [
          'Recent run IDs (or “None” when not yet running).',
          'A status that is blue/neutral while processing, not greenwashed.',
        ],
        why: 'This proves the pipeline actually runs end-to-end and isn’t a static “dashboard with config fields”.',
      },
      {
        id: 'step-nightfall',
        title: 'Nightfall DLP (Content Enforcement)',
        status: evidence.integrations.nightfall.status,
        evidenceHref: '/evidence#integration-nightfall',
        do: [
          'Verify the DLP policy name and decision counts (allowed/redacted/quarantined).',
          'Confirm scans are observed before indexing claims are made.',
        ],
        see: [
          'Policy name plus non-zero scan counts when data is flowing.',
          'Clear status: configured vs verified based on observed scans.',
        ],
        why: 'DLP is the security guarantee. Evidence should show that content is screened before it becomes searchable.',
      },
      {
        id: 'step-supabase',
        title: 'Supabase + pgvector (Storage)',
        status: evidence.integrations.supabase.status,
        evidenceHref: '/evidence#integration-supabase',
        do: [
          'Confirm schema version, pgvector enabled, and RLS verification.',
          'Review document/chunk/vector counts for basic consistency.',
        ],
        see: [
          'Schema version and pgvector/RLS signals present.',
          'Counts displayed without rounding or “success” coloring when unknown.',
        ],
        why: 'This is the system of record for sanitized content and embeddings. Storage evidence should be concrete and auditable.',
      },
      {
        id: 'step-retrieval',
        title: 'Retrieval Verification (Proven Search)',
        status: evidence.integrations.embeddings.status,
        evidenceHref: '/evidence#retrieval-test',
        do: [
          'Inspect the retrieval test: success_count/query_count and pass criteria.',
          'Review sample queries and the returned (doc_id, chunk_id, score) rows.',
        ],
        see: [
          `Retrieval result: ${retrievalStr} (pass criteria is explicit).`,
          'If failing, top failure reasons are listed and linked to the relevant integration.',
        ],
        why: 'Retrieval is where “configured” demos fall apart. This step requires receipts that queries return real, attributable results.',
      },
    ];
  }, [evidence]);

  const [activeId, setActiveId] = useState(steps[0]?.id ?? '');

  useEffect(() => {
    setActiveId(steps[0]?.id ?? '');
  }, [steps]);

  useEffect(() => {
    if (steps.length === 0) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const els = steps
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (best?.target?.id) setActiveId(best.target.id);
      },
      { rootMargin: '-20% 0% -65% 0%', threshold: [0, 0.25, 0.5, 0.75] }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [steps]);

  return (
    <div className="grid lg:grid-cols-12 gap-8 items-start">
      {/* Mobile: sections dropdown (non-sticky) */}
      <div className="lg:hidden">
        <label htmlFor="proof-sections" className="text-label font-semibold text-neutral-600">
          Sections
        </label>
        <select
          id="proof-sections"
          value={activeId}
          onChange={(e) => {
            const id = e.target.value;
            setActiveId(id);
            scrollToId(id);
          }}
          className={cn(
            'mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-body-md text-neutral-900',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
          )}
        >
          {steps.map((s, idx) => (
            <option key={s.id} value={s.id}>
              {idx + 1}. {s.title}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop: sticky side nav */}
      <aside className="hidden lg:block lg:col-span-4">
        <nav className="sticky top-24 rounded-2xl border border-neutral-200 bg-white shadow-card p-4">
          <div className="text-label font-semibold text-neutral-600">Sections</div>
          <ul className="mt-3 space-y-1">
            {steps.map((s, idx) => {
              const active = activeId === s.id;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveId(s.id);
                      scrollToId(s.id);
                    }}
                    className={cn(
                      'w-full flex items-start gap-3 rounded-xl px-3 py-2 text-left transition-colors',
                      active ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-700 hover:bg-neutral-50'
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 w-7 h-7 rounded-full border flex items-center justify-center text-body-xs font-semibold',
                        active ? 'bg-white border-neutral-300' : 'bg-neutral-50 border-neutral-200'
                      )}
                    >
                      {idx + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-body-sm font-medium truncate">{s.title}</span>
                      <span className="mt-2 block">
                        <StatusPill status={s.status} size="sm" showIcon={false} />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <div className="lg:col-span-8 space-y-6">
        {steps.map((s, idx) => (
          <div key={s.id} id={s.id} className="scroll-mt-24">
            <Card>
              <CardHeader action={<StatusPill status={s.status} />}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-semibold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <CardTitle as="h3" className="text-display-sm">
                      {s.title}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-label font-semibold text-neutral-600">What you do</div>
                    <ul className="mt-3 space-y-2">
                      {s.do.map((line) => (
                        <li key={line} className="flex gap-2 text-body-sm text-neutral-700">
                          <span className="mt-0.5 text-neutral-400">•</span>
                          <span className="min-w-0">{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-label font-semibold text-neutral-600">What you should see</div>
                    <ul className="mt-3 space-y-2">
                      {s.see.map((line) => (
                        <li key={line} className="flex gap-2 text-body-sm text-neutral-700">
                          <span className="mt-0.5 text-neutral-400">•</span>
                          <span className="min-w-0">{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Button href={s.evidenceHref} variant="outline" size="sm">
                    View evidence →
                  </Button>
                  <Button href="/evidence" variant="ghost" size="sm">
                    Open receipts dashboard
                  </Button>
                </div>

                {s.why && (
                  <div className="mt-6">
                    <DetailsDisclosure title="Why this matters">
                      <p className="text-body-sm text-neutral-700">{s.why}</p>
                    </DetailsDisclosure>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
