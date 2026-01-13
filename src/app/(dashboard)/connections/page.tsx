import { Button, Card, CardContent, CardHeader, CardTitle, SectionHeader } from '@/components/ui';

export const metadata = {
  title: 'Connections | Executive Intent',
  description: 'Connect Gmail and Calendar for ingestion and proof.',
};

export default function ConnectionsPage() {
  return (
    <div>
      <SectionHeader
        title="Connections"
        description="Connect source systems for ingestion. Proof pages stay brutally honest: green only means verified."
        actions={
          <Button href="/proof" variant="outline" size="md">
            View Proof →
          </Button>
        }
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-semibold flex-shrink-0">
                G
              </div>
              <div className="min-w-0">
                <CardTitle as="h2" className="text-display-sm">
                  Google (Gmail + Calendar)
                </CardTitle>
                <p className="mt-2 text-body-sm text-neutral-800">
                  Grants source access. Inngest then syncs messages/events and emits DLP + embedding jobs.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button href="/api/google/connect" variant="primary" size="lg" className="w-full sm:w-auto">
                Connect Google OAuth
              </Button>
              <Button href="/evidence#integration-google-oauth" variant="outline" size="lg" className="w-full sm:w-auto">
                View receipts →
              </Button>
            </div>

            <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4">
              <div className="text-label font-semibold text-neutral-900">Requested scopes</div>
              <ul className="mt-3 space-y-2 text-body-sm text-neutral-800">
                <li>• Gmail read-only (profile + messages)</li>
                <li>• Calendar read-only (events)</li>
                <li>• User info (email + profile)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2" className="text-display-sm">
              What this enables
            </CardTitle>
            <p className="mt-2 text-body-sm text-neutral-800">
              Once connected, the pipeline can ingest → DLP scan → chunk → embed → retrieve. The receipts dashboard shows exactly what is verified.
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-body-sm text-neutral-800">
              <li>• Ingestion activity appears under Inngest receipts.</li>
              <li>• DLP outcomes (allow/redact/quarantine) appear under Nightfall receipts.</li>
              <li>• Vector coverage and retrieval probes appear under Supabase + Embeddings receipts.</li>
            </ul>
            <div className="mt-6">
              <Button href="/evidence" variant="secondary" size="lg" className="w-full">
                Open Evidence Dashboard →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

