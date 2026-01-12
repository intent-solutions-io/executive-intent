import Link from "next/link";
import { loadEvidenceSync, getPlaceholderEvidence } from "@/lib/evidence/loadEvidence";
import { EvidenceCards } from "@/components/proof/EvidenceCards";
import { EvidenceJsonViewer } from "@/components/proof/EvidenceJsonViewer";
import { EvidenceTimeline } from "@/components/proof/EvidenceTimeline";
import { formatTimestamp, formatCommitHash, generateMarkdownSummary } from "@/lib/evidence/format";

export const metadata = {
  title: "Evidence Bundle | Executive Intent",
  description: "Complete machine-readable evidence bundle for Executive Intent",
};

export default function EvidencePage() {
  const evidence = loadEvidenceSync() || getPlaceholderEvidence();
  const markdownSummary = generateMarkdownSummary(evidence);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg" />
                <span className="font-bold text-2xl text-black">Executive Intent</span>
              </Link>
            </div>
            <div className="flex items-center gap-8">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Home
              </Link>
              <Link href="/demo" className="text-gray-600 hover:text-gray-900">
                Proof
              </Link>
              <Link href="/evidence" className="text-blue-600 font-medium">
                Evidence
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">Evidence Bundle</h1>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Complete, machine-readable proof of Executive Intent integrations.
              Download for independent verification.
            </p>
          </div>
        </div>
      </div>

      {/* Metadata Strip */}
      <div className="bg-gray-900 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <div>
              <span className="text-gray-400">Product:</span>{" "}
              <span className="font-medium">{evidence.product}</span>
            </div>
            <div>
              <span className="text-gray-400">CI Provider:</span>{" "}
              <span className="font-medium">{evidence.ci.provider}</span>
            </div>
            <div>
              <span className="text-gray-400">Workflow:</span>{" "}
              <span className="font-medium">{evidence.ci.workflow}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Download Links */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/evidence/evidence.json"
              download
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              evidence.json
            </a>
            <a
              href="/evidence/evidence.md"
              download
              className="flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              evidence.md
            </a>
            <a
              href={evidence.ci.run_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              CI Run #{evidence.ci.run_id}
            </a>
          </div>
        </div>
      </section>

      {/* Build & Deploy Info */}
      <section className="py-12" id="build">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Build & Deploy</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Commit Info */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Git Commit</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Hash</dt>
                  <dd className="font-mono">
                    <a
                      href={`https://github.com/intent-solutions-io/executive-intent/commit/${evidence.commit.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {evidence.commit.hash}
                    </a>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Branch</dt>
                  <dd className="font-mono">{evidence.commit.branch}</dd>
                </div>
              </dl>
            </div>

            {/* Deploy Info */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Firebase Deploy</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Project</dt>
                  <dd className="font-mono">{evidence.deploy.firebase_project}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Site</dt>
                  <dd className="font-mono">{evidence.deploy.site}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">URL</dt>
                  <dd>
                    <a
                      href={evidence.deploy.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {evidence.deploy.url}
                    </a>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Completed</dt>
                  <dd>{formatTimestamp(evidence.deploy.completed_at)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Status */}
      <section className="py-12 bg-white border-t" id="integrations">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Integration Status</h2>
          <EvidenceCards evidence={evidence} />
        </div>
      </section>

      {/* Evidence Timeline */}
      <section className="py-12" id="timeline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Evidence Timeline</h2>
          <p className="text-gray-600 mb-8">
            Chronological record of all integration checks and deployment events.
          </p>
          <EvidenceTimeline evidence={evidence} />
        </div>
      </section>

      {/* Integration Detail Sections */}
      <section className="py-12 bg-white border-t" id="supabase">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Supabase Details</h2>
          <div className="bg-white rounded-lg border p-6">
            <dl className="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <dt className="text-gray-500 mb-1">Project Ref</dt>
                <dd className="font-mono">{evidence.integrations.supabase.project_ref}</dd>
              </div>
              <div>
                <dt className="text-gray-500 mb-1">Schema Version</dt>
                <dd className="font-mono">{evidence.integrations.supabase.schema_version}</dd>
              </div>
              <div>
                <dt className="text-gray-500 mb-1">pgvector</dt>
                <dd>{evidence.integrations.supabase.pgvector ? "Enabled" : "Disabled"}</dd>
              </div>
              <div>
                <dt className="text-gray-500 mb-1">RLS Verified</dt>
                <dd>{evidence.integrations.supabase.rls_verified ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="text-gray-500 mb-1">Documents</dt>
                <dd>{evidence.integrations.supabase.document_count.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-gray-500 mb-1">Chunks</dt>
                <dd>{evidence.integrations.supabase.chunk_count.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-gray-500 mb-1">Vectors</dt>
                <dd>{evidence.integrations.supabase.vector_count.toLocaleString()}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Raw Evidence Viewers */}
      <section className="py-12 bg-gray-100" id="raw">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Raw Evidence</h2>

          {/* JSON Viewer */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">evidence.json</h3>
            <EvidenceJsonViewer evidence={evidence} />
          </div>

          {/* Markdown Preview */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">evidence.md (Preview)</h3>
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
                <span className="text-gray-600 font-mono text-sm">evidence.md</span>
                <a
                  href="/evidence/evidence.md"
                  download
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Download
                </a>
              </div>
              <pre className="p-4 text-sm text-gray-700 overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap">
                {markdownSummary}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Verification Instructions */}
      <section className="py-12 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Independent Verification</h2>
          <div className="prose prose-gray max-w-none">
            <p>
              To independently verify this evidence:
            </p>
            <ol className="list-decimal list-inside space-y-2 mt-4">
              <li>
                <strong>Download evidence.json</strong> - Contains all machine-readable proof
              </li>
              <li>
                <strong>Check the CI run</strong> - Visit{" "}
                <a href={evidence.ci.run_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  CI Run #{evidence.ci.run_id}
                </a>{" "}
                to see the build that generated this evidence
              </li>
              <li>
                <strong>Verify the commit</strong> - Check the{" "}
                <a
                  href={`https://github.com/intent-solutions-io/executive-intent/commit/${evidence.commit.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  git commit {formatCommitHash(evidence.commit.hash)}
                </a>{" "}
                to see the code
              </li>
              <li>
                <strong>Test the integrations</strong> - Each integration status can be verified against the respective service dashboards
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>
            Evidence generated {formatTimestamp(evidence.generated_at)}
          </p>
          <p className="mt-2">
            <Link href="/" className="text-blue-600 hover:underline">Home</Link>
            {" | "}
            <Link href="/demo" className="text-blue-600 hover:underline">Proof Walkthrough</Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
