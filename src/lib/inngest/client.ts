import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "executive-intent",
  schemas: new Map([
    // Google OAuth events
    ["google/connect.completed", {
      data: {
        tenantId: "",
        userId: "",
        connectionId: "",
      },
    }],
    ["google/disconnect.requested", {
      data: {
        tenantId: "",
        connectionId: "",
      },
    }],
    // Sync events
    ["gmail/sync.requested", {
      data: {
        connectionId: "",
        tenantId: "",
      },
    }],
    ["calendar/sync.requested", {
      data: {
        connectionId: "",
        tenantId: "",
      },
    }],
    // DLP events
    ["dlp/scan.requested", {
      data: {
        tenantId: "",
        documentId: "",
        source: "" as "gmail" | "calendar",
        externalId: "",
        textFields: {} as Record<string, string>,
      },
    }],
    // Embedding events
    ["embedding/index.requested", {
      data: {
        tenantId: "",
        documentId: "",
      },
    }],
    // Retention events
    ["retention/enforce.requested", {
      data: {
        tenantId: "",
      },
    }],
  ]),
});

// Event type definitions
export type GoogleConnectEvent = {
  name: "google/connect.completed";
  data: {
    tenantId: string;
    userId: string;
    connectionId: string;
  };
};

export type GoogleDisconnectEvent = {
  name: "google/disconnect.requested";
  data: {
    tenantId: string;
    connectionId: string;
  };
};

export type GmailSyncEvent = {
  name: "gmail/sync.requested";
  data: {
    connectionId: string;
    tenantId: string;
  };
};

export type CalendarSyncEvent = {
  name: "calendar/sync.requested";
  data: {
    connectionId: string;
    tenantId: string;
  };
};

export type DlpScanEvent = {
  name: "dlp/scan.requested";
  data: {
    tenantId: string;
    documentId: string;
    source: "gmail" | "calendar";
    externalId: string;
    textFields: Record<string, string>;
  };
};

export type EmbeddingIndexEvent = {
  name: "embedding/index.requested";
  data: {
    tenantId: string;
    documentId: string;
  };
};

export type RetentionEvent = {
  name: "retention/enforce.requested";
  data: {
    tenantId: string;
  };
};
