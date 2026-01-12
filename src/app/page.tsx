import Link from "next/link";
import { loadEvidenceSync, getPlaceholderEvidence } from "@/lib/evidence/loadEvidence";
import { EvidenceCards } from "@/components/proof/EvidenceCards";
import { formatTimestamp, formatCommitHash } from "@/lib/evidence/format";

export default function Home() {
  // Load evidence at build time
  const evidence = loadEvidenceSync() || getPlaceholderEvidence();

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg" />
              <span className="font-bold text-2xl text-gray-900">Executive Intent</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/demo" className="text-gray-600 hover:text-gray-900">
                Proof
              </Link>
              <Link href="/evidence" className="text-gray-600 hover:text-gray-900">
                Evidence
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/demo"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                View Proof
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight">
            Executive Intent
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Gmail + Calendar → Nightfall DLP → pgvector search (Supabase) orchestrated by Inngest.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/demo"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-lg"
            >
              View Proof
            </Link>
            <Link
              href="/evidence"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition text-lg"
            >
              Evidence Bundle
            </Link>
          </div>
        </div>
      </section>

      {/* What's Built */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">What&apos;s Built</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              <span>Google OAuth connection (Gmail + Calendar)</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              <span>Incremental ingestion orchestration (Inngest)</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              <span>Nightfall DLP enforcement (allow/redact/quarantine)</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              <span>Embeddings in Supabase pgvector</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              <span>Retrieval verification (vector query)</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              <span>Audit trail + retention hooks</span>
            </div>
          </div>
        </div>
      </section>

      {/* Receipts Strip */}
      <section className="py-8 bg-gray-100 border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <div className="text-center">
              <div className="text-gray-500 mb-1">Commit</div>
              <div className="font-mono font-medium">{formatCommitHash(evidence.commit.hash)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 mb-1">CI Run</div>
              <a
                href={evidence.ci.run_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono font-medium text-blue-600 hover:underline"
              >
                {evidence.ci.run_id}
              </a>
            </div>
            <div className="text-center">
              <div className="text-gray-500 mb-1">Deploy URL</div>
              <a
                href={evidence.deploy.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono font-medium text-blue-600 hover:underline"
              >
                {evidence.deploy.site}
              </a>
            </div>
            <div className="text-center">
              <div className="text-gray-500 mb-1">Deployed</div>
              <div className="font-mono font-medium">{formatTimestamp(evidence.deploy.completed_at)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 mb-1">Firebase</div>
              <div className="font-mono font-medium">{evidence.deploy.firebase_project}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Proof Cards */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">Integration Status</h2>
          <EvidenceCards evidence={evidence} />
          <div className="text-center mt-8">
            <Link
              href="/evidence"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View full evidence bundle →
            </Link>
          </div>
        </div>
      </section>

      {/* Build Info */}
      <section className="py-8 bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-500">
            Generated {formatTimestamp(evidence.generated_at)}
            {" • "}
            <a
              href={`https://github.com/intent-solutions-io/executive-intent/commit/${evidence.commit.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-mono"
            >
              {formatCommitHash(evidence.commit.hash)}
            </a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-blue-600 rounded" />
              <span className="font-semibold">Executive Intent</span>
            </div>
            <div className="flex gap-8 text-sm text-gray-600">
              <Link href="/demo" className="hover:text-gray-900">
                Proof
              </Link>
              <Link href="/evidence" className="hover:text-gray-900">
                Evidence
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Intent Solutions. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
