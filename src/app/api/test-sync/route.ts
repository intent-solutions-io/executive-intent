import { NextResponse } from "next/server";
import { fetchGmailMessagesImap } from "@/lib/google/gmail-imap";
import { scanTextFields } from "@/lib/nightfall/client";
import { applyDlpPolicy } from "@/lib/nightfall/policy";
import { generateEmbedding } from "@/lib/embeddings/provider";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Test endpoint to run the full pipeline:
 * IMAP fetch → DLP scan → Embeddings → Store
 *
 * GET /api/test-sync?count=3
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const count = parseInt(searchParams.get("count") || "3");

  const results: Array<{
    messageId: string;
    subject: string;
    dlpStatus: string;
    embedded: boolean;
    error?: string;
  }> = [];

  try {
    console.log(`[test-sync] Fetching ${count} emails via IMAP...`);

    // Step 1: Fetch emails via IMAP
    const { messages } = await fetchGmailMessagesImap(count);
    console.log(`[test-sync] Fetched ${messages.length} messages`);

    const supabase = await createAdminClient();

    // Create a test tenant if not exists
    let tenantId: string;

    // Try to find existing tenant
    const { data: existingTenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("name", "intentsolutions.io")
      .single();

    if (existingTenant) {
      tenantId = (existingTenant as { id: string }).id;
    } else {
      // Create new tenant
      const { data: newTenant, error: tenantError } = await supabase
        .from("tenants")
        .insert({ name: "intentsolutions.io" } as never)
        .select()
        .single();

      if (tenantError || !newTenant) {
        console.error("[test-sync] Tenant error:", tenantError);
        return NextResponse.json({ error: `Failed to create tenant: ${tenantError?.message}` }, { status: 500 });
      }
      tenantId = (newTenant as { id: string }).id;
    }

    // Get or create a test user
    let userId: string;
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("tenant_id", tenantId)
      .single();

    if (existingUser) {
      userId = (existingUser as { id: string }).id;
    } else {
      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert({
          tenant_id: tenantId,
          email: process.env.GMAIL_USER_EMAIL || "test@intentsolutions.io",
          role: "admin",
        } as never)
        .select()
        .single();

      if (userError || !newUser) {
        console.error("[test-sync] User error:", userError);
        return NextResponse.json({ error: `Failed to create user: ${userError?.message}` }, { status: 500 });
      }
      userId = (newUser as { id: string }).id;
    }

    // Get or create a test connection for IMAP sync
    let connectionId: string;
    const { data: existingConn } = await supabase
      .from("google_connections")
      .select("id")
      .eq("tenant_id", tenantId)
      .single();

    if (existingConn) {
      connectionId = (existingConn as { id: string }).id;
    } else {
      const { data: newConn, error: connError } = await supabase
        .from("google_connections")
        .insert({
          tenant_id: tenantId,
          user_id: userId,
          status: "active",
          scopes: ["imap"],
          encrypted_refresh_token: "imap-test",
          encrypted_dek: "imap-test",
        } as never)
        .select()
        .single();

      if (connError || !newConn) {
        console.error("[test-sync] Connection error:", connError);
        return NextResponse.json({ error: `Failed to create connection: ${connError?.message}` }, { status: 500 });
      }
      connectionId = (newConn as { id: string }).id;
    }

    // Process each message
    for (const message of messages) {
      const result: typeof results[0] = {
        messageId: message.id,
        subject: message.subject,
        dlpStatus: "pending",
        embedded: false,
      };

      try {
        // Step 2: DLP scan
        console.log(`[test-sync] Scanning: ${message.subject}`);
        const textFields = {
          subject: message.subject,
          body: message.body.substring(0, 5000), // Limit body size
          snippet: message.snippet,
          from: message.from,
        };

        const scanResult = await scanTextFields(textFields);
        const dlpDecision = applyDlpPolicy(scanResult.findings);
        result.dlpStatus = dlpDecision.action;

        console.log(`[test-sync] DLP: ${dlpDecision.action} (${scanResult.findings.length} findings)`);

        // Step 3: Store document
        const { data: docData, error: docError } = await supabase
          .from("documents")
          .upsert({
            tenant_id: tenantId,
            connection_id: connectionId,
            source: "gmail",
            external_id: message.id,
            external_url: message.externalUrl,
            title: message.subject,
            author: message.from,
            participants: { from: message.from, to: message.to },
            timestamp: message.date,
            dlp_status: dlpDecision.action,
            dlp_summary: {
              findings: scanResult.findings.length,
              categories: dlpDecision.findings.map(f => f.detector),
            },
          } as never, { onConflict: "tenant_id,source,external_id" })
          .select()
          .single();

        if (docError) {
          console.error(`[test-sync] Doc error:`, docError);
          result.error = docError.message;
          results.push(result);
          continue;
        }

        const documentId = (docData as { id: string })?.id;

        // Step 4: Generate embeddings (only if allowed or redacted)
        if (dlpDecision.action !== "quarantined" && documentId) {
          console.log(`[test-sync] Generating embedding...`);

          // Use sanitized text if redacted
          const textToEmbed = dlpDecision.action === "redacted"
            ? dlpDecision.sanitizedText?.body || message.snippet
            : `${message.subject}\n\n${message.snippet}`;

          const embedding = await generateEmbedding(textToEmbed);

          // Store embedding
          const { error: chunkError } = await supabase
            .from("document_chunks")
            .upsert({
              tenant_id: tenantId,
              document_id: documentId,
              chunk_index: 0,
              chunk_text: textToEmbed.substring(0, 1000),
              embedding: JSON.stringify(embedding),
              chunk_hash: Buffer.from(textToEmbed).toString("base64").substring(0, 32),
            } as never, { onConflict: "document_id,chunk_index" });

          if (chunkError) {
            console.error(`[test-sync] Chunk error:`, chunkError);
            result.error = chunkError.message;
          } else {
            result.embedded = true;
            console.log(`[test-sync] Embedded successfully`);
          }
        }
      } catch (msgError) {
        console.error(`[test-sync] Error processing message:`, msgError);
        result.error = msgError instanceof Error ? msgError.message : "Unknown error";
      }

      results.push(result);
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("[test-sync] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
