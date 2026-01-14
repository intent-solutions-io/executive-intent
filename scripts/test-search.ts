import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '../src/lib/embeddings/provider';

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Query that matches the actual content
  const query = 'Nightfall email verification';
  console.log('Query:', query);

  const embedding = await generateEmbedding(query);
  console.log('Embedding generated, dimensions:', embedding.length);

  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: 0.3,
    match_count: 5,
    filter_tenant_id: '11e5ae6e-9413-46c4-a4f7-f67bdc71d514'
  } as never);

  if (error) {
    console.error('Error:', error);
  } else {
    const results = data as Array<{ similarity: number; chunk_text: string }>;
    console.log('Results:', results?.length || 0);
    results?.slice(0, 3).forEach((r, i) => {
      console.log(`${i+1}. Score: ${r.similarity.toFixed(3)} | Chunk: ${r.chunk_text?.substring(0, 60)}...`);
    });
  }
}

main().catch(console.error);
