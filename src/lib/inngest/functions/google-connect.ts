import { inngest } from "../client";

/**
 * Handles Google OAuth connection completion.
 *
 * Steps:
 * 1. Exchange auth code for tokens (already done in callback)
 * 2. Encrypt refresh token with KMS envelope scheme
 * 3. Upsert google_connections record
 * 4. Initialize sync cursors
 * 5. Emit gmail/sync.requested and calendar/sync.requested
 */
export const googleConnect = inngest.createFunction(
  {
    id: "google-connect",
    name: "Google OAuth Connect",
    retries: 3,
  },
  { event: "google/connect.completed" },
  async ({ event, step }) => {
    const { tenantId, userId, connectionId } = event.data;

    // Step 1: Initialize sync cursors
    await step.run("initialize-cursors", async () => {
      // TODO: Update google_connections with initial cursor values
      console.log(`Initializing cursors for connection ${connectionId}`);
      return { success: true };
    });

    // Step 2: Trigger Gmail sync
    await step.sendEvent("trigger-gmail-sync", {
      name: "gmail/sync.requested",
      data: {
        connectionId,
        tenantId,
      },
    });

    // Step 3: Trigger Calendar sync
    await step.sendEvent("trigger-calendar-sync", {
      name: "calendar/sync.requested",
      data: {
        connectionId,
        tenantId,
      },
    });

    // Step 4: Create audit event
    await step.run("audit-connect", async () => {
      // TODO: Insert audit event
      console.log(`Audit: User ${userId} connected Google for tenant ${tenantId}`);
      return { audited: true };
    });

    return {
      success: true,
      connectionId,
      message: "Google connection initialized, sync started",
    };
  }
);

/**
 * Handles Google disconnect and data purge.
 *
 * Steps:
 * 1. Revoke tokens (if supported)
 * 2. Delete all documents/chunks for this connection
 * 3. Delete the connection record
 * 4. Create audit event
 */
export const googleDisconnect = inngest.createFunction(
  {
    id: "google-disconnect",
    name: "Google Disconnect + Purge",
    retries: 3,
  },
  { event: "google/disconnect.requested" },
  async ({ event, step }) => {
    const { tenantId, connectionId } = event.data;

    // Step 1: Delete all document chunks
    await step.run("delete-chunks", async () => {
      // TODO: Delete from document_chunks where connection documents
      console.log(`Deleting chunks for connection ${connectionId}`);
      return { deleted: 0 };
    });

    // Step 2: Delete all documents
    await step.run("delete-documents", async () => {
      // TODO: Delete from documents where connection_id
      console.log(`Deleting documents for connection ${connectionId}`);
      return { deleted: 0 };
    });

    // Step 3: Delete connection record
    await step.run("delete-connection", async () => {
      // TODO: Delete from google_connections
      console.log(`Deleting connection ${connectionId}`);
      return { deleted: true };
    });

    // Step 4: Audit
    await step.run("audit-disconnect", async () => {
      console.log(`Audit: Connection ${connectionId} disconnected from tenant ${tenantId}`);
      return { audited: true };
    });

    return {
      success: true,
      message: "Google connection and all data purged",
    };
  }
);
