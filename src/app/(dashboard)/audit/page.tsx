import { Button, Card, CardContent, CardHeader, CardTitle, SectionHeader, Table } from '@/components/ui';

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
      <SectionHeader
        title="Audit Log"
        description="A ledger of connect/sync/DLP/index actions. This page is a UI shell; the receipts dashboard remains the source of truth."
      />

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle as="h2" className="text-display-sm">
              Filters
            </CardTitle>
            <p className="mt-2 text-body-sm text-neutral-800">
              Export is intentionally disabled in the demo shell.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <select className="w-full sm:w-auto rounded-lg border border-neutral-300 bg-white px-3 py-2 text-body-md text-neutral-900">
                <option value="">All Actions</option>
                <option value="connect">Connect</option>
                <option value="disconnect">Disconnect</option>
                <option value="sync">Sync</option>
                <option value="dlp_scan">DLP Scan</option>
                <option value="embed">Embed</option>
                <option value="query">Query</option>
              </select>
              <select className="w-full sm:w-auto rounded-lg border border-neutral-300 bg-white px-3 py-2 text-body-md text-neutral-900">
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <Button variant="outline" size="md" className="w-full sm:w-auto" disabled>
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Table
          data={auditEvents}
          rowKey={(r) => r.id}
          emptyState="No audit events yet."
          columns={[
            {
              key: "ts",
              header: "timestamp",
              cell: (r) => <span className="font-mono text-neutral-900">{new Date(r.createdAt).toLocaleString()}</span>,
            },
            {
              key: "action",
              header: "action",
              cell: (r) => <span className="font-mono text-neutral-900">{r.action}</span>,
            },
            {
              key: "object",
              header: "object",
              cell: (r) => <span className="text-neutral-900">{r.objectType}</span>,
            },
            {
              key: "details",
              header: "details",
              cell: (r) => <span className="font-mono text-neutral-900">{JSON.stringify(r.metadata)}</span>,
            },
          ]}
        />
      </div>
    </div>
  );
}
