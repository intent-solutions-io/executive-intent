import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { chunkEmail, TextChunk } from "@/lib/embeddings/chunker";
import { generateEmbeddings } from "@/lib/embeddings/provider";

interface DocumentRow {
  id: string;
  title: string | null;
  source: string;
  dlp_status: string;
}

/**
 * Handles embedding generation and vector indexing.
 *
 * Steps:
 * 1. Get document and sanitized content
 * 2. Chunk text into segments
 * 3. Generate embeddings
 * 4. Upsert chunks to pgvector in Supabase
 */
export const embedIndex = inngest.createFunction(
  {
    id: "embed-index",
    name: "Generate Embeddings + Index",
    retries: 3,
  },
  { event: "embedding/index.requested" },
  async ({ event, step }) => {
    const { tenantId, documentId, sanitizedText } = event.data;

    // Step 1: Fetch document info
    const document = await step.run("fetch-document", async () => {
      const supabase = await createAdminClient();
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .single();

      if (error || !data) {
        throw new Error(`Document not found: ${documentId}`);
      }

      const row = data as unknown as DocumentRow;

      // Skip if quarantined
      if (row.dlp_status === "quarantined") {
        return {
          id: row.id,
          title: row.title,
          source: row.source,
          dlpStatus: row.dlp_status,
          skip: true,
          reason: "Document is quarantined",
        };
      }

      return {
        id: row.id,
        title: row.title,
        source: row.source,
        dlpStatus: row.dlp_status,
        skip: false,
      };
    });

    // Skip if document is quarantined
    if (document.skip) {
      return {
        success: false,
        reason: "reason" in document ? document.reason : "Document skipped",
      };
    }

    // Step 2: Prepare text for embedding
    const textToEmbed = await step.run("prepare-text", async () => {
      // Use sanitized text if provided, otherwise fetch from document
      if (sanitizedText) {
        const subject = sanitizedText.subject || document.title || "";
        const body = sanitizedText.body || sanitizedText.snippet || "";
        return { subject, body };
      }

      // Fallback: just use the title if no sanitized text
      return {
        subject: document.title || "",
        body: "",
      };
    });

    // Step 3: Chunk the text
    const chunks = await step.run("chunk-text", async () => {
      const emailChunks = chunkEmail(textToEmbed.subject, textToEmbed.body, {
        maxChunkSize: 800,
        overlapSize: 100,
      });

      console.log(`Created ${emailChunks.length} chunks for document ${documentId}`);
      return emailChunks;
    });

    // Skip if no chunks
    if (chunks.length === 0) {
      return {
        success: true,
        documentId,
        chunksIndexed: 0,
        reason: "No text to embed",
      };
    }

    // Step 4: Generate embeddings
    const embeddings = await step.run("generate-embeddings", async () => {
      const texts = chunks.map((c: TextChunk) => c.text);

      console.log(`Generating embeddings for ${texts.length} chunks`);

      try {
        const vectors = await generateEmbeddings(texts);
        return vectors;
      } catch (error) {
        console.error("Embedding generation failed:", error);
        throw error;
      }
    });

    // Step 5: Delete existing chunks for this document
    await step.run("delete-old-chunks", async () => {
      const supabase = await createAdminClient();
      const { error } = await supabase
        .from("document_chunks")
        .delete()
        .eq("document_id", documentId);

      if (error) {
        console.error("Failed to delete old chunks:", error);
      }

      return { deleted: true };
    });

    // Step 6: Upsert to pgvector
    await step.run("upsert-vectors", async () => {
      const supabase = await createAdminClient();
      console.log(`Upserting ${embeddings.length} vectors for document ${documentId}`);

      const chunkRecords = chunks.map((chunk: TextChunk, i: number) => ({
        tenant_id: tenantId,
        document_id: documentId,
        chunk_index: chunk.index,
        chunk_text: chunk.text,
        embedding: embeddings[i],
        chunk_hash: chunk.hash,
      }));

      const { error } = await supabase
        .from("document_chunks")
        .insert(chunkRecords as never);

      if (error) {
        console.error("Failed to insert chunks:", error);
        throw error;
      }

      return { upserted: chunkRecords.length };
    });

    // Step 7: Audit
    await step.run("audit-embed", async () => {
      const supabase = await createAdminClient();
      await supabase.from("audit_events").insert({
        tenant_id: tenantId,
        action: "embedding_indexed",
        object_type: "document",
        object_id: documentId,
        metadata: {
          chunksIndexed: embeddings.length,
          source: document.source,
        },
      } as never);

      console.log(`Audit: Embedded ${embeddings.length} chunks for document ${documentId}`);
      return { audited: true };
    });

    return {
      success: true,
      documentId,
      chunksIndexed: embeddings.length,
    };
  }
);
