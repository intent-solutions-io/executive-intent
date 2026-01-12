import Link from "next/link";
import { loadEvidenceSync, getPlaceholderEvidence } from "@/lib/evidence/loadEvidence";
import { ProofStepper } from "@/components/proof/ProofStepper";
import { formatTimestamp, formatCommitHash } from "@/lib/evidence/format";

export const metadata = {
  title: "Proof Walkthrough | Executive Intent",
  description: "Step-by-step verification of Executive Intent integrations",
};

export default function DemoPage() {
  const evidence = loadEvidenceSync() || getPlaceholderEvidence();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg" />
                <span className="font-semibold text-xl">Executive Intent</span>
              </Link>
            </div>
            <div className="flex items-center gap-8">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Home
              </Link>
              <Link href="/demo" className="text-blue-600 font-medium">
                Proof
              </Link>
              <Link href="/evidence" className="text-gray-600 hover:text-gray-900">
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
            <h1 className="text-4xl font-bold text-gray-900">Proof Walkthrough</h1>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Follow the evidence chain verifying each integration.
              Each step links to verifiable artifacts in the evidence bundle.
            </p>
            <div className="mt-6 flex justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-600">Verified OK</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-gray-600">Degraded</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-400" />
                <span className="text-gray-600">Not Configured</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Build Info Strip */}
      <div className="bg-gray-900 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <div>
              <span className="text-gray-400">Commit:</span>{" "}
              <a
                href={`https://github.com/intent-solutions-io/executive-intent/commit/${evidence.commit.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-blue-400 hover:underline"
              >
                {formatCommitHash(evidence.commit.hash)}
              </a>
            </div>
            <div>
              <span className="text-gray-400">Branch:</span>{" "}
              <span className="font-medium">{evidence.commit.branch}</span>
            </div>
            <div>
              <span className="text-gray-400">Generated:</span>{" "}
              <span className="font-medium">{formatTimestamp(evidence.generated_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Proof Stepper */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProofStepper evidence={evidence} />
        </div>
      </section>

      {/* Evidence Link */}
      <section className="py-12 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Want the raw evidence?
          </h2>
          <p className="text-gray-600 mb-6">
            Download the complete machine-readable evidence bundle for independent verification.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/evidence"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              View Evidence Bundle
            </Link>
            <a
              href="/evidence/evidence.json"
              download
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Download JSON
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          Evidence generated {formatTimestamp(evidence.generated_at)}
        </div>
      </footer>
    </main>
  );
}
