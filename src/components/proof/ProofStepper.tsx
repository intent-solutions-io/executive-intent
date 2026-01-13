'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { EvidenceBundle, IntegrationStatus } from '@/lib/evidence/types';
import { getStatusColor, getStatusIcon, getStatusLabel, formatRelativeTime, formatRationale } from '@/lib/evidence/format';
import Link from 'next/link';

interface StepProps {
  number: number;
  title: string;
  description: string;
  status: IntegrationStatus;
  evidencePointer: string;
  details: string[];
  screenshotPath?: string;
  isLast?: boolean;
  id: string;
}

function getStepCircleStyle(status: IntegrationStatus): string {
  switch (status) {
    case 'verified':
      return 'bg-green-100 text-green-700 border-green-300';
    case 'processing':
    case 'connected':
      return 'bg-blue-100 text-blue-700 border-blue-300';
    case 'configured':
      return 'bg-gray-100 text-gray-500 border-gray-300';
    case 'degraded':
      return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    case 'error':
      return 'bg-red-100 text-red-700 border-red-300';
    default:
      return 'bg-gray-100 text-gray-500 border-gray-300';
  }
}

function getCheckmarkStyle(status: IntegrationStatus): string {
  switch (status) {
    case 'verified':
      return 'text-green-500';
    case 'processing':
    case 'connected':
      return 'text-blue-500';
    case 'degraded':
      return 'text-yellow-500';
    case 'error':
      return 'text-red-500';
    default:
      return 'text-gray-400';
  }
}

function getCheckmarkIcon(status: IntegrationStatus): string {
  switch (status) {
    case 'verified':
      return '✓';
    case 'processing':
    case 'connected':
      return '◉';
    case 'degraded':
      return '⚠';
    case 'error':
      return '✗';
    default:
      return '○';
  }
}

function Step({ number, title, description, status, evidencePointer, details, screenshotPath, isLast, id }: StepProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="relative" id={id}>
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-neutral-200" />
      )}

      <div className="flex gap-3 sm:gap-4">
        {/* Step number */}
        <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold border-2 text-sm sm:text-base ${getStepCircleStyle(status)}`}>
          {number}
        </div>

        {/* Content */}
        <div className="flex-1 pb-8 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
            <h3 className="font-semibold text-neutral-900 text-base sm:text-lg">{title}</h3>
            <span className={`px-2 py-1 rounded text-xs font-medium self-start ${getStatusColor(status)}`}>
              {getStatusIcon(status)} {getStatusLabel(status)}
            </span>
          </div>

          <p className="text-neutral-600 mb-4 text-sm sm:text-base">{description}</p>

          {/* Screenshot evidence */}
          {screenshotPath && !imageError && (
            <div className="mb-4 rounded-lg border overflow-hidden shadow-sm">
              <Image
                src={screenshotPath}
                alt={`${title} - vendor dashboard screenshot`}
                width={800}
                height={450}
                className="w-full h-auto"
                onError={() => setImageError(true)}
              />
              <div className="bg-neutral-50 px-3 py-2 text-xs text-neutral-500 border-t">
                Vendor dashboard screenshot
              </div>
            </div>
          )}

          <div className="bg-neutral-50 rounded-lg p-3 sm:p-4 mb-3">
            <h4 className="text-sm font-medium text-neutral-700 mb-2">What this proves:</h4>
            <ul className="text-sm text-neutral-600 space-y-1">
              {details.map((detail, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className={`mt-0.5 flex-shrink-0 ${getCheckmarkStyle(status)}`}>
                    {getCheckmarkIcon(status)}
                  </span>
                  <span className="break-words">{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link
            href={`/evidence#${evidencePointer}`}
            className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
          >
            View evidence
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Mobile section dropdown
interface SectionNavProps {
  steps: { id: string; title: string; status: IntegrationStatus }[];
  activeSection: string;
  onSelect: (id: string) => void;
}

function MobileSectionNav({ steps, activeSection, onSelect }: SectionNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeStep = steps.find(s => s.id === activeSection) || steps[0];

  return (
    <div className="lg:hidden mb-6 sticky top-16 z-40 -mx-4 px-4 py-3 bg-white/95 backdrop-blur-sm border-b border-neutral-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-100 rounded-lg text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${
            activeStep.status === 'verified' ? 'bg-green-500' :
            activeStep.status === 'error' ? 'bg-red-500' :
            activeStep.status === 'degraded' ? 'bg-yellow-500' :
            'bg-neutral-400'
          }`} />
          <span className="font-medium text-neutral-900">{activeStep.title}</span>
        </div>
        <svg
          className={`w-5 h-5 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-4 right-4 top-full mt-1 bg-white rounded-lg border border-neutral-200 shadow-lg overflow-hidden z-50">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => {
                onSelect(step.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 transition-colors ${
                step.id === activeSection ? 'bg-neutral-50' : ''
              }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                step.status === 'verified' ? 'bg-green-500' :
                step.status === 'error' ? 'bg-red-500' :
                step.status === 'degraded' ? 'bg-yellow-500' :
                'bg-neutral-400'
              }`} />
              <span className="text-sm text-neutral-700">{step.title}</span>
              <span className={`ml-auto text-xs px-1.5 py-0.5 rounded ${getStatusColor(step.status)}`}>
                {getStatusLabel(step.status)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Desktop sidebar nav
function DesktopSideNav({ steps, activeSection, onSelect }: SectionNavProps) {
  return (
    <nav className="hidden lg:block sticky top-24 w-56 flex-shrink-0">
      <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
        Verification Steps
      </h3>
      <ul className="space-y-1">
        {steps.map((step, idx) => (
          <li key={step.id}>
            <button
              onClick={() => onSelect(step.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                step.id === activeSection
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border ${
                step.status === 'verified' ? 'bg-green-100 text-green-700 border-green-300' :
                step.status === 'error' ? 'bg-red-100 text-red-700 border-red-300' :
                step.status === 'degraded' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                'bg-neutral-100 text-neutral-500 border-neutral-300'
              }`}>
                {idx + 1}
              </span>
              <span className="text-sm truncate">{step.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

interface ProofStepperProps {
  evidence: EvidenceBundle;
}

export function ProofStepper({ evidence }: ProofStepperProps) {
  const { integrations } = evidence;
  const [activeSection, setActiveSection] = useState('step-1');

  const rt = integrations.embeddings.retrieval_test;
  const retrievalTestStr = rt.query_count > 0
    ? `${rt.success_count}/${rt.query_count} ${rt.passed ? 'passed' : 'below threshold'}`
    : 'Not run yet';

  const steps: (Omit<StepProps, 'number' | 'isLast'> & { id: string })[] = [
    {
      id: 'step-1',
      title: 'Connect Google',
      description: 'OAuth configured and ready for Gmail + Calendar access.',
      status: integrations.google_oauth.status,
      evidencePointer: 'google_oauth',
      details: [
        `${integrations.google_oauth.scopes.length} OAuth scopes configured`,
        `Token: ${integrations.google_oauth.token_valid ? 'Valid' : 'Not yet validated'}`,
        integrations.google_oauth.last_connect_at
          ? `Last successful connect: ${formatRelativeTime(integrations.google_oauth.last_connect_at)}`
          : 'Awaiting first user connection',
        `Status rationale: ${formatRationale(integrations.google_oauth.rationale)}`,
      ],
    },
    {
      id: 'step-2',
      title: 'Documents Synced',
      description: 'Gmail and Calendar data synced to Supabase database.',
      status: integrations.supabase.status,
      evidencePointer: 'supabase',
      screenshotPath: '/demo-assets/screens/step-1-supabase-documents.png',
      details: [
        `${integrations.supabase.document_count} documents synced`,
        `${integrations.supabase.chunk_count} chunks created`,
        `${integrations.supabase.vector_count} vectors indexed`,
        `Schema version: ${integrations.supabase.schema_version}`,
        `RLS: ${integrations.supabase.rls_verified ? 'Verified' : 'Not Verified'}`,
      ],
    },
    {
      id: 'step-3',
      title: 'Embeddings Indexed',
      description: 'Sanitized content vectorized in Supabase pgvector.',
      status: integrations.embeddings.status,
      evidencePointer: 'embeddings',
      screenshotPath: '/demo-assets/screens/step-2-supabase-embeddings.png',
      details: [
        `${integrations.embeddings.vector_count} vectors indexed`,
        `pgvector: ${integrations.supabase.pgvector ? 'Enabled' : 'Disabled'}`,
        integrations.embeddings.last_index_at
          ? `Last indexed: ${formatRelativeTime(integrations.embeddings.last_index_at)}`
          : 'No embeddings indexed yet',
        `Retrieval test: ${retrievalTestStr} (threshold: ${rt.threshold})`,
      ],
    },
    {
      id: 'step-4',
      title: 'Sync Runs (Inngest)',
      description: 'Orchestration pipeline for incremental Gmail and Calendar sync.',
      status: integrations.inngest.status,
      evidencePointer: 'inngest',
      screenshotPath: '/demo-assets/screens/step-3-inngest-runs.png',
      details: [
        `Environment: ${integrations.inngest.env}`,
        `${integrations.inngest.last_run_ids.length} recent workflow runs`,
        `${integrations.inngest.recent_failures} recent failures`,
        integrations.inngest.last_success_at
          ? `Last success: ${formatRelativeTime(integrations.inngest.last_success_at)}`
          : 'No successful runs observed yet',
      ],
    },
    {
      id: 'step-5',
      title: 'Nightfall DLP',
      description: 'Every document scanned before indexing: allow, redact, or quarantine.',
      status: integrations.nightfall.status,
      evidencePointer: 'nightfall',
      screenshotPath: '/demo-assets/screens/step-4-nightfall-dlp.png',
      details: [
        `Policy: ${integrations.nightfall.policy_name}`,
        `${integrations.nightfall.last_scan_counts.allowed} documents allowed`,
        `${integrations.nightfall.last_scan_counts.redacted} documents redacted`,
        `${integrations.nightfall.last_scan_counts.quarantined} documents quarantined`,
        integrations.nightfall.last_scan_at
          ? `Last scan: ${formatRelativeTime(integrations.nightfall.last_scan_at)}`
          : 'No scans observed yet',
      ],
    },
  ];

  const navSteps = steps.map(s => ({ id: s.id, title: s.title, status: s.status }));

  const handleSelectSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Step IDs for scroll tracking (stable reference)
  const stepIds = useMemo(() => steps.map(s => s.id), [steps.length]);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150;

      for (let i = stepIds.length - 1; i >= 0; i--) {
        const element = document.getElementById(stepIds[i]);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(stepIds[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [stepIds]);

  return (
    <div className="flex gap-8">
      {/* Desktop sidebar */}
      <DesktopSideNav steps={navSteps} activeSection={activeSection} onSelect={handleSelectSection} />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile dropdown nav */}
        <MobileSectionNav steps={navSteps} activeSection={activeSection} onSelect={handleSelectSection} />

        {/* Steps */}
        <div className="max-w-2xl">
          {steps.map((step, index) => (
            <Step
              key={step.id}
              number={index + 1}
              isLast={index === steps.length - 1}
              {...step}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
