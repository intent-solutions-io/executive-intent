/**
 * Re-index all documents with Vertex AI embeddings
 *
 * Deletes old chunks and regenerates embeddings for all allowed/redacted documents.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { generateEmbeddings } from '../src/lib/embeddings/provider';

interface Document {
  id: string;
  title: string | null;
  tenant_id: string;
  dlp_status: string;
}

interface Chunk {
  document_id: string;
  chunk_text: string;
}

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('🔍 Finding documents to re-embed...\n');

  // Get all documents that are allowed or redacted (not quarantined or pending)
  const { data: docs, error: docsError } = await supabase
    .from('documents')
    .select('id, title, tenant_id, dlp_status')
    .in('dlp_status', ['allowed', 'redacted']);

  if (docsError) {
    console.error('Error fetching documents:', docsError);
    process.exit(1);
  }

  const documents = (docs || []) as Document[];
  console.log(`Found ${documents.length} documents to re-embed\n`);

  if (documents.length === 0) {
    console.log('No documents to process.');
    return;
  }

  // Get existing chunks to know what text to re-embed
  const docIds = documents.map(d => d.id);
  const { data: chunks, error: chunksError } = await supabase
    .from('document_chunks')
    .select('document_id, chunk_text')
    .in('document_id', docIds);

  if (chunksError) {
    console.error('Error fetching chunks:', chunksError);
    process.exit(1);
  }

  const chunksByDoc = new Map<string, string[]>();
  for (const chunk of (chunks || []) as Chunk[]) {
    if (!chunksByDoc.has(chunk.document_id)) {
      chunksByDoc.set(chunk.document_id, []);
    }
    chunksByDoc.get(chunk.document_id)!.push(chunk.chunk_text);
  }

  console.log('📝 Processing documents...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const doc of documents) {
    const existingTexts = chunksByDoc.get(doc.id) || [];

    // If no existing chunks, use the title
    const textsToEmbed = existingTexts.length > 0
      ? existingTexts
      : doc.title
        ? [doc.title]
        : [];

    if (textsToEmbed.length === 0) {
      console.log(`⏭️  Skipping ${doc.id}: no text to embed`);
      continue;
    }

    try {
      console.log(`🔄 Re-embedding: ${doc.title || doc.id} (${textsToEmbed.length} chunks)`);

      // Generate new embeddings with Vertex AI
      const embeddings = await generateEmbeddings(textsToEmbed);

      // Delete old chunks
      await supabase
        .from('document_chunks')
        .delete()
        .eq('document_id', doc.id);

      // Insert new chunks with Vertex AI embeddings
      const newChunks = textsToEmbed.map((text, i) => ({
        tenant_id: doc.tenant_id,
        document_id: doc.id,
        chunk_index: i,
        chunk_text: text,
        embedding: embeddings[i],
        chunk_hash: Buffer.from(text).toString('base64').substring(0, 32),
      }));

      const { error: insertError } = await supabase
        .from('document_chunks')
        .insert(newChunks as never);

      if (insertError) {
        console.error(`   ❌ Failed to insert chunks:`, insertError.message);
        errorCount++;
        continue;
      }

      console.log(`   ✅ Embedded ${embeddings.length} chunks`);
      successCount++;
    } catch (err) {
      console.error(`   ❌ Error:`, err instanceof Error ? err.message : err);
      errorCount++;
    }
  }

  console.log(`\n✨ Done! ${successCount} succeeded, ${errorCount} failed`);

  // Verify new vector count
  const { count } = await supabase
    .from('document_chunks')
    .select('id', { count: 'exact', head: true })
    .not('embedding', 'is', null);

  console.log(`📊 Total vectors in database: ${count}`);
}

main().catch(console.error);
