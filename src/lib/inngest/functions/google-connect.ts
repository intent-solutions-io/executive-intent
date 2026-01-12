import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Handles Google OAuth connection completion.
 *
 * Steps:
 * 1. Initialize sync cursors (tokens already stored by callback)
 * 2. Emit gmail/sync.requested and calendar/sync.requested
 * 3. Create audit event
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
    const supabase = createAdminClient();

    // Step 1: Initialize sync cursors
    await step.run("initialize-cursors", async () => {
      // The connection was already created by the callback
      // Just ensure cursors are initialized
      const { error } = await supabase
        .from("google_connections")
        .update({
          gmail_history_id: null, // Will be set on first sync
          calendar_sync_token: null,
          last_synced_at: null,
        } as never)
        .eq("id", connectionId);

      if (error) {
        console.error("Failed to initialize cursors:", error);
      }

      console.log(`Initialized cursors for connection ${connectionId}`);
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

    // Step 3: Trigger Calendar sync (if implemented)
    // For MVP, we'll skip calendar sync
    // await step.sendEvent("trigger-calendar-sync", {
    //   name: "calendar/sync.requested",
    //   data: {
    //     connectionId,
    //     tenantId,
    //   },
    // });

    // Step 4: Create audit event
    await step.run("audit-connect", async () => {
      await supabase.from("audit_events").insert({
        tenant_id: tenantId,
        user_id: userId,
        action: "google_oauth_initialized",
        object_type: "google_connection",
        object_id: connectionId,
        metadata: {
          triggeredSync: true,
        },
      } as never);

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
 * 1. Delete all document chunks for this connection
 * 2. Delete all documents for this connection
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
    const supabase = createAdminClient();

    // Step 1: Get all document IDs for this connection
    const documentIds = await step.run("get-document-ids", async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id")
        .eq("connection_id", connectionId);

      if (error) {
        console.error("Failed to fetch documents:", error);
        return [] as string[];
      }

      return ((data || []) as Array<{ id: string }>).map(d => d.id);
    });

    // Step 2: Delete all document chunks
    await step.run("delete-chunks", async () => {
      if (documentIds.length === 0) {
        return { deleted: 0 };
      }

      const { error, count } = await supabase
        .from("document_chunks")
        .delete()
        .in("document_id", documentIds);

      if (error) {
        console.error("Failed to delete chunks:", error);
      }

      console.log(`Deleted ${count || 0} chunks for connection ${connectionId}`);
      return { deleted: count || 0 };
    });

    // Step 3: Delete all documents
    await step.run("delete-documents", async () => {
      const { error, count } = await supabase
        .from("documents")
        .delete()
        .eq("connection_id", connectionId);

      if (error) {
        console.error("Failed to delete documents:", error);
      }

      console.log(`Deleted ${count || 0} documents for connection ${connectionId}`);
      return { deleted: count || 0 };
    });

    // Step 4: Delete connection record
    await step.run("delete-connection", async () => {
      const { error } = await supabase
        .from("google_connections")
        .delete()
        .eq("id", connectionId);

      if (error) {
        console.error("Failed to delete connection:", error);
      }

      console.log(`Deleted connection ${connectionId}`);
      return { deleted: true };
    });

    // Step 5: Audit
    await step.run("audit-disconnect", async () => {
      await supabase.from("audit_events").insert({
        tenant_id: tenantId,
        action: "google_disconnected",
        object_type: "google_connection",
        object_id: connectionId,
        metadata: {
          documentsDeleted: documentIds.length,
        },
      } as never);

      console.log(`Audit: Connection ${connectionId} disconnected from tenant ${tenantId}`);
      return { audited: true };
    });

    return {
      success: true,
      message: "Google connection and all data purged",
      documentsDeleted: documentIds.length,
    };
  }
);
