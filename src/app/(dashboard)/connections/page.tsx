import Link from "next/link";

export default function ConnectionsPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Connections</h1>
        <p className="text-gray-600">
          Manage your Google account connections.
        </p>
      </div>

      {/* Connection Cards */}
      <div className="space-y-6">
        {/* Gmail Connection */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📧</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Gmail</h2>
                <p className="text-sm text-gray-500">
                  Sync emails for decision tracking and search
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                Not connected
              </span>
              <Link
                href="/api/google/connect"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
              >
                Connect
              </Link>
            </div>
          </div>

          {/* Permissions Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Requested Permissions
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Read-only access to emails</li>
              <li>• View email metadata (sender, subject, date)</li>
              <li>• Search email content</li>
            </ul>
          </div>
        </div>

        {/* Calendar Connection */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Google Calendar</h2>
                <p className="text-sm text-gray-500">
                  Track meetings and commitments
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                Not connected
              </span>
              <Link
                href="/api/google/connect"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
              >
                Connect
              </Link>
            </div>
          </div>

          {/* Permissions Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Requested Permissions
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Read-only access to calendar events</li>
              <li>• View event details and attendees</li>
              <li>• Access free/busy information</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-xl">
        <div className="flex items-start gap-4">
          <div className="text-2xl">🛡️</div>
          <div>
            <h3 className="font-semibold text-green-800">
              Your Data is Protected
            </h3>
            <p className="text-sm text-green-700 mt-1">
              All content is scanned by Nightfall DLP before indexing. Sensitive
              data is automatically redacted or quarantined. OAuth tokens are
              encrypted using Google Cloud KMS.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
