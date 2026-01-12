import { Inngest, EventSchemas } from "inngest";

// Event type definitions
type Events = {
  "google/connect.completed": {
    data: {
      tenantId: string;
      userId: string;
      connectionId: string;
    };
  };
  "google/disconnect.requested": {
    data: {
      tenantId: string;
      connectionId: string;
    };
  };
  "gmail/sync.requested": {
    data: {
      connectionId: string;
      tenantId: string;
    };
  };
  "calendar/sync.requested": {
    data: {
      connectionId: string;
      tenantId: string;
    };
  };
  "dlp/scan.requested": {
    data: {
      tenantId: string;
      documentId: string;
      source: "gmail" | "calendar";
      externalId: string;
      textFields: Record<string, string>;
    };
  };
  "embedding/index.requested": {
    data: {
      tenantId: string;
      documentId: string;
    };
  };
  "retention/enforce.requested": {
    data: {
      tenantId: string;
    };
  };
};

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "executive-intent",
  schemas: new EventSchemas().fromRecord<Events>(),
});

// Export event types for use in functions
export type GoogleConnectEvent = Events["google/connect.completed"];
export type GoogleDisconnectEvent = Events["google/disconnect.requested"];
export type GmailSyncEvent = Events["gmail/sync.requested"];
export type CalendarSyncEvent = Events["calendar/sync.requested"];
export type DlpScanEvent = Events["dlp/scan.requested"];
export type EmbeddingIndexEvent = Events["embedding/index.requested"];
export type RetentionEvent = Events["retention/enforce.requested"];
