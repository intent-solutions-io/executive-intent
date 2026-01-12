import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg" />
              <span className="font-semibold text-xl">Executive Intent</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link
                href="/features"
                className="text-gray-600 hover:text-gray-900"
              >
                Features
              </Link>
              <Link
                href="/security"
                className="text-gray-600 hover:text-gray-900"
              >
                Security
              </Link>
              <Link
                href="/how-it-works"
                className="text-gray-600 hover:text-gray-900"
              >
                How It Works
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight">
            Your inbox + calendar,
            <br />
            <span className="text-primary-600">organized for decisions</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
            DLP-enforced. Source-linked. Executive-ready. Transform Gmail and
            Calendar into a secure decision layer with AI-powered search.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/signup"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition text-lg"
            >
              Start Free Trial
            </Link>
            <Link
              href="/how-it-works"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition text-lg"
            >
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            The Problem with Email Search
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📧</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">
                Scattered Commitments
              </h3>
              <p className="text-gray-400">
                Your decisions are buried in email threads, impossible to find
                when you need them.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">No Single View</h3>
              <p className="text-gray-400">
                Gmail search returns everything except what matters to your
                decisions.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Security Risk</h3>
              <p className="text-gray-400">
                Sensitive data mixed with searchable content without any
                protection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Executive Intent connects to your Gmail and Calendar, scans for
            sensitive data, and creates a searchable index with full provenance.
          </p>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔗</span>
              </div>
              <div className="text-sm text-primary-600 font-semibold mb-2">
                Step 1
              </div>
              <h3 className="font-semibold mb-2">Connect Google</h3>
              <p className="text-sm text-gray-600">
                One-click OAuth to Gmail and Calendar
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🛡️</span>
              </div>
              <div className="text-sm text-primary-600 font-semibold mb-2">
                Step 2
              </div>
              <h3 className="font-semibold mb-2">DLP Scans</h3>
              <p className="text-sm text-gray-600">
                Nightfall scans every message for sensitive data
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔎</span>
              </div>
              <div className="text-sm text-primary-600 font-semibold mb-2">
                Step 3
              </div>
              <h3 className="font-semibold mb-2">Search with Sources</h3>
              <p className="text-sm text-gray-600">
                Ask questions and get answers with provenance
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔄</span>
              </div>
              <div className="text-sm text-primary-600 font-semibold mb-2">
                Step 4
              </div>
              <h3 className="font-semibold mb-2">Stay Current</h3>
              <p className="text-sm text-gray-600">
                Automatic sync keeps your index up to date
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">
            Enterprise-Grade Security
          </h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Built with security-first principles. DLP before indexing. Always.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-2xl mb-3">🔒</div>
              <h3 className="font-semibold mb-2">Nightfall DLP</h3>
              <p className="text-sm text-gray-600">
                Every message scanned before indexing
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-2xl mb-3">🔐</div>
              <h3 className="font-semibold mb-2">Encrypted Tokens</h3>
              <p className="text-sm text-gray-600">
                KMS envelope encryption for credentials
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-2xl mb-3">🏢</div>
              <h3 className="font-semibold mb-2">Tenant Isolation</h3>
              <p className="text-sm text-gray-600">
                Row-level security for every query
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-2xl mb-3">📋</div>
              <h3 className="font-semibold mb-2">Full Audit Trail</h3>
              <p className="text-sm text-gray-600">
                Every action logged and traceable
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Start Making Decisions, Not Searching
          </h2>
          <p className="text-gray-600 mb-8">
            Join executives who trust Executive Intent to keep their
            communications organized and secure.
          </p>
          <Link
            href="/signup"
            className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition text-lg inline-block"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-primary-600 rounded" />
              <span className="font-semibold">Executive Intent</span>
            </div>
            <div className="flex gap-8 text-sm text-gray-600">
              <Link href="/features" className="hover:text-gray-900">
                Features
              </Link>
              <Link href="/security" className="hover:text-gray-900">
                Security
              </Link>
              <Link href="/privacy" className="hover:text-gray-900">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-gray-900">
                Terms
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Intent Solutions. All rights
            reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
