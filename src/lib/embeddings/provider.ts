/**
 * Embedding Provider for Executive Intent
 *
 * Generates text embeddings for vector search.
 * Uses OpenAI's text-embedding-3-small model (768 dimensions).
 *
 * Storage is handled by Supabase pgvector.
 */

const OPENAI_EMBEDDING_URL = "https://api.openai.com/v1/embeddings";
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 768;

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

/**
 * Generates an embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // TODO: Fix env loading issue - use Secret Manager in production
  const apiKey = process.env.OPENAI_API_KEY || "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";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not set for embedding generation");
  }

  const response = await fetch(OPENAI_EMBEDDING_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI embedding error:", response.status, errorText);
    throw new Error(`OpenAI embedding error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Generates embeddings for multiple texts in batch
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not set for embedding generation");
  }

  if (texts.length === 0) {
    return [];
  }

  // Filter out empty texts
  const validTexts = texts.filter(t => t && t.trim().length > 0);

  if (validTexts.length === 0) {
    return [];
  }

  const response = await fetch(OPENAI_EMBEDDING_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: validTexts,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI embedding error:", response.status, errorText);
    throw new Error(`OpenAI embedding error: ${response.status}`);
  }

  const data = await response.json();

  // Sort by index to maintain order
  const embeddings = data.data
    .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
    .map((item: { embedding: number[] }) => item.embedding);

  return embeddings;
}

/**
 * Gets the expected embedding dimension
 */
export function getEmbeddingDimension(): number {
  return EMBEDDING_DIMENSIONS;
}

/**
 * Gets the model being used
 */
export function getEmbeddingModel(): string {
  return EMBEDDING_MODEL;
}
