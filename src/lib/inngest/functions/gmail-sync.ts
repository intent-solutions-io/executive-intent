import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchGmailMessages, refreshAccessToken, GmailMessage } from "@/lib/google/gmail";

interface ConnectionRow {
  id: string;
  tenant_id: string;
  gmail_history_id: string | null;
  encrypted_refresh_token: string;
  encrypted_dek: string;
}

/**
 * Handles Gmail incremental sync.
 *
 * Steps:
 * 1. Get connection and refresh access token
 * 2. Fetch Gmail messages (incremental or initial)
 * 3. Upsert documents to Supabase
 * 4. Emit DLP scan events for each message
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

    // Step 1: Get connection and refresh token
    const connection = await step.run("get-connection", async () => {
      const supabase = await createAdminClient();
      const { data, error } = await supabase
        .from("google_connections")
        .select("*")
        .eq("id", connectionId)
        .single();

      if (error || !data) {
        throw new Error(`Connection not found: ${connectionId}`);
      }

      const row = data as unknown as ConnectionRow;

      // The refresh token is stored in encrypted_refresh_token
      // The access token is temporarily stored in encrypted_dek
      // In production, these would be properly encrypted with KMS
      const refreshToken = row.encrypted_refresh_token;
      let accessToken = row.encrypted_dek;

      // Refresh the access token
      try {
        const refreshed = await refreshAccessToken(refreshToken);
        accessToken = refreshed.accessToken;

        // Update the stored access token
        await supabase
          .from("google_connections")
          .update({ encrypted_dek: accessToken } as never)
          .eq("id", connectionId);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Try to use existing access token
      }

      return {
        id: row.id,
        tenantId: row.tenant_id,
        historyId: row.gmail_history_id,
        accessToken,
      };
    });

    // Step 2: Fetch Gmail messages
    const syncResult = await step.run("fetch-gmail", async () => {
      console.log(`Fetching Gmail for connection ${connectionId}, historyId: ${connection.historyId}`);

      const result = await fetchGmailMessages(
        connection.accessToken,
        connection.historyId,
        3 // Limited for testing - change to 50 for production
      );

      console.log(`Fetched ${result.messages.length} messages, new historyId: ${result.newHistoryId}`);
      return result;
    });

    // Step 3: Process each message - upsert to documents table
    const documentIds: Array<{ messageId: string; documentId: string }> = [];

    for (const message of syncResult.messages) {
      const docResult = await step.run(`upsert-doc-${message.id}`, async () => {
        return await upsertGmailDocument(tenantId, connectionId, message);
      });

      documentIds.push({ messageId: message.id, documentId: docResult.documentId });

      // Step 4: Emit DLP scan request for each document
      await step.sendEvent(`dlp-scan-${message.id}`, {
        name: "dlp/scan.requested",
        data: {
          tenantId,
          documentId: docResult.documentId,
          source: "gmail" as const,
          externalId: message.id,
          textFields: {
            subject: message.subject,
            body: message.body,
            snippet: message.snippet,
            from: message.from,
          },
        },
      });
    }

    // Step 5: Update sync cursor
    await step.run("update-cursor", async () => {
      const supabase = await createAdminClient();
      if (syncResult.newHistoryId) {
        const { error } = await supabase
          .from("google_connections")
          .update({
            gmail_history_id: syncResult.newHistoryId,
            last_synced_at: new Date().toISOString(),
          } as never)
          .eq("id", connectionId);

        if (error) {
          console.error("Failed to update cursor:", error);
        }
      }
      return { updated: true };
    });

    // Step 6: Create audit event
    await step.run("audit-sync", async () => {
      const supabase = await createAdminClient();
      await supabase.from("audit_events").insert({
        tenant_id: tenantId,
        action: "gmail_sync_completed",
        object_type: "google_connection",
        object_id: connectionId,
        metadata: {
          messagesProcessed: syncResult.messages.length,
          newHistoryId: syncResult.newHistoryId,
        },
      } as never);
      return { audited: true };
    });

    return {
      success: true,
      messagesProcessed: syncResult.messages.length,
      documentIds,
      newHistoryId: syncResult.newHistoryId,
    };
  }
);

interface DocumentRow {
  id: string;
}

/**
 * Upserts a Gmail message as a document
 */
async function upsertGmailDocument(
  tenantId: string,
  connectionId: string,
  message: GmailMessage
): Promise<{ documentId: string; isNew: boolean }> {
  const supabase = await createAdminClient();

  // Check if document already exists
  const { data: existingData } = await supabase
    .from("documents")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("source", "gmail")
    .eq("external_id", message.id)
    .single();

  const existing = existingData as unknown as DocumentRow | null;

  if (existing) {
    // Update existing document
    await supabase
      .from("documents")
      .update({
        title: message.subject,
        author: message.from,
        participants: {
          from: message.from,
          to: message.to,
        },
        timestamp: message.date ? new Date(message.date).toISOString() : null,
        external_url: message.externalUrl,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", existing.id);

    return { documentId: existing.id, isNew: false };
  }

  // Insert new document
  const { data: newDocData, error } = await supabase
    .from("documents")
    .insert({
      tenant_id: tenantId,
      connection_id: connectionId,
      source: "gmail",
      external_id: message.id,
      external_url: message.externalUrl,
      title: message.subject,
      author: message.from,
      participants: {
        from: message.from,
        to: message.to,
      },
      timestamp: message.date ? new Date(message.date).toISOString() : null,
      dlp_status: "pending",
    } as never)
    .select("id")
    .single();

  if (error || !newDocData) {
    throw new Error(`Failed to create document: ${error?.message}`);
  }

  const newDoc = newDocData as unknown as DocumentRow;
  return { documentId: newDoc.id, isNew: true };
}
