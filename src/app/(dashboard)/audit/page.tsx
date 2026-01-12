export default function AuditPage() {
  // Mock audit events
  const auditEvents = [
    {
      id: "1",
      action: "connect",
      objectType: "connection",
      metadata: { provider: "google" },
      createdAt: new Date().toISOString(),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-600">
          Track all actions and events in your account.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4">
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Actions</option>
            <option value="connect">Connect</option>
            <option value="disconnect">Disconnect</option>
            <option value="sync">Sync</option>
            <option value="dlp_scan">DLP Scan</option>
            <option value="embed">Embed</option>
            <option value="query">Query</option>
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button className="ml-auto text-primary-600 font-medium text-sm hover:text-primary-700">
            Export CSV
          </button>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Object
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {auditEvents.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No audit events yet. Actions will appear here as you use the
                  app.
                </td>
              </tr>
            ) : (
              auditEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(event.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        event.action === "connect"
                          ? "bg-green-100 text-green-800"
                          : event.action === "disconnect"
                          ? "bg-red-100 text-red-800"
                          : event.action === "dlp_scan"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {event.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.objectType}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {JSON.stringify(event.metadata)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* DLP Summary */}
      <div className="mt-8 grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-sm text-gray-500 mb-1">Total DLP Scans</div>
          <div className="text-3xl font-bold text-gray-900">0</div>
          <div className="text-xs text-gray-400 mt-1">Last 30 days</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-sm text-gray-500 mb-1">Items Redacted</div>
          <div className="text-3xl font-bold text-yellow-600">0</div>
          <div className="text-xs text-gray-400 mt-1">Sensitive data removed</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-sm text-gray-500 mb-1">Items Quarantined</div>
          <div className="text-3xl font-bold text-red-600">0</div>
          <div className="text-xs text-gray-400 mt-1">Not indexed</div>
        </div>
      </div>
    </div>
  );
}
