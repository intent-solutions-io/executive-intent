import Link from "next/link";

export default function DashboardPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Your decision operating system is ready.
        </p>
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Ask or Search</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="What did I commit to this week? Search emails and events..."
            className="flex-1 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition">
            Search
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-sm text-gray-500 mb-1">Documents Indexed</div>
          <div className="text-3xl font-bold text-gray-900">0</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-sm text-gray-500 mb-1">Items Redacted</div>
          <div className="text-3xl font-bold text-yellow-600">0</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-sm text-gray-500 mb-1">Items Quarantined</div>
          <div className="text-3xl font-bold text-red-600">0</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-sm text-gray-500 mb-1">Last Synced</div>
          <div className="text-lg font-semibold text-gray-900">Never</div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Connection Status</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📧</span>
              </div>
              <div>
                <div className="font-medium">Gmail</div>
                <div className="text-sm text-gray-500">Not connected</div>
              </div>
            </div>
            <Link
              href="/dashboard/connections"
              className="text-primary-600 font-medium hover:text-primary-700"
            >
              Connect
            </Link>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📅</span>
              </div>
              <div>
                <div className="font-medium">Google Calendar</div>
                <div className="text-sm text-gray-500">Not connected</div>
              </div>
            </div>
            <Link
              href="/dashboard/connections"
              className="text-primary-600 font-medium hover:text-primary-700"
            >
              Connect
            </Link>
          </div>
        </div>
      </div>

      {/* Decision Panels Placeholder */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Upcoming Obligations</h2>
          <div className="text-gray-500 text-sm">
            Connect Gmail and Calendar to see your upcoming obligations.
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Open Loops</h2>
          <div className="text-gray-500 text-sm">
            Threads waiting for your reply will appear here.
          </div>
        </div>
      </div>
    </div>
  );
}
