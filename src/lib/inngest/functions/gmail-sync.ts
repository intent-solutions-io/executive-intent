import { inngest } from "../client";

/**
 * Handles Gmail incremental sync.
 *
 * Steps:
 * 1. Decrypt refresh token (KMS)
 * 2. Fetch Gmail history delta (or initial list if no history)
 * 3. Normalize messages (metadata + body/snippet)
 * 4. For each message, emit dlp/scan.requested
 * 5. Update sync cursor
 */
export const gmailSync = inngest.createFunction(
  {
    id: "gmail-sync",
    name: "Gmail Incremental Sync",
    retries: 3,
    concurrency: {
      limit: 1,
      key: "event.data.connectionId",
    },
  },
  { event: "gmail/sync.requested" },
  async ({ event, step }) => {
    const { connectionId, tenantId } = event.data;

    // Step 1: Get connection and decrypt token
    const connection = await step.run("get-connection", async () => {
      // TODO: Fetch connection from DB
      // TODO: Decrypt refresh token using KMS
      console.log(`Fetching connection ${connectionId}`);
      return {
        id: connectionId,
        historyId: null as string | null,
        accessToken: "TODO", // Would be refreshed from decrypted refresh token
      };
    });

    // Step 2: Fetch Gmail messages
    const messages = await step.run("fetch-gmail", async () => {
      // TODO: Use Gmail API to fetch history delta
      // If no historyId, do initial sync
      console.log(`Fetching Gmail for connection ${connectionId}`);

      // Mock response
      return {
        messages: [] as Array<{
          id: string;
          threadId: string;
          subject: string;
          from: string;
          to: string[];
          date: string;
          snippet: string;
          body: string;
        }>,
        newHistoryId: "12345",
      };
    });

    // Step 3: Process each message
    for (const message of messages.messages) {
      // Upsert document record
      const documentId = await step.run(`upsert-doc-${message.id}`, async () => {
        // TODO: Upsert document in DB
        console.log(`Upserting document for message ${message.id}`);
        return `doc-${message.id}`;
      });

      // Emit DLP scan request
      await step.sendEvent(`dlp-scan-${message.id}`, {
        name: "dlp/scan.requested",
        data: {
          tenantId,
          documentId,
          source: "gmail" as const,
          externalId: message.id,
          textFields: {
            subject: message.subject,
            body: message.body,
            snippet: message.snippet,
          },
        },
      });
    }

    // Step 4: Update sync cursor
    await step.run("update-cursor", async () => {
      // TODO: Update gmail_history_id in google_connections
      console.log(`Updating cursor to ${messages.newHistoryId}`);
      return { updated: true };
    });

    // Step 5: Audit
    await step.run("audit-sync", async () => {
      console.log(`Audit: Gmail sync completed for connection ${connectionId}, ${messages.messages.length} messages`);
      return { audited: true };
    });

    return {
      success: true,
      messagesProcessed: messages.messages.length,
      newHistoryId: messages.newHistoryId,
    };
  }
);
