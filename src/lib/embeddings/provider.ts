/**
 * Embedding Provider for Executive Intent
 *
 * Generates text embeddings for vector search.
 * Uses Vertex AI text-embedding-005 model (768 dimensions).
 * Authenticates via Workload Identity Federation (ADC) - no API keys.
 *
 * Storage is handled by Supabase pgvector.
 */

import { PredictionServiceClient, helpers } from "@google-cloud/aiplatform";

const EMBEDDING_MODEL = "text-embedding-005";
const EMBEDDING_DIMENSIONS = 768;
const LOCATION = process.env.GCP_LOCATION || "us-central1";

let predictionClient: PredictionServiceClient | null = null;

function getClient(): PredictionServiceClient {
  if (!predictionClient) {
    predictionClient = new PredictionServiceClient({
      apiEndpoint: `${LOCATION}-aiplatform.googleapis.com`,
    });
  }
  return predictionClient;
}

function getEndpoint(): string {
  const projectId = process.env.GCP_PROJECT_ID;
  if (!projectId) {
    throw new Error("GCP_PROJECT_ID not set for Vertex AI embeddings");
  }
  return `projects/${projectId}/locations/${LOCATION}/publishers/google/models/${EMBEDDING_MODEL}`;
}

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
  const client = getClient();
  const endpoint = getEndpoint();

  const instance = helpers.toValue({
    content: text,
    taskType: "RETRIEVAL_DOCUMENT",
  });

  const parameters = helpers.toValue({
    outputDimensionality: EMBEDDING_DIMENSIONS,
  });

  const [response] = await client.predict({
    endpoint,
    instances: [instance!],
    parameters,
  });

  if (!response.predictions || response.predictions.length === 0) {
    throw new Error("No embedding returned from Vertex AI");
  }

  const prediction = response.predictions[0];
  const embeddingData = prediction?.structValue?.fields?.embeddings?.structValue?.fields?.values?.listValue?.values;

  if (!embeddingData) {
    throw new Error("Unexpected Vertex AI response structure");
  }

  return embeddingData.map((v) => v.numberValue ?? 0);
}

/**
 * Generates embeddings for multiple texts in batch
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  // Filter out empty texts
  const validTexts = texts.filter(t => t && t.trim().length > 0);

  if (validTexts.length === 0) {
    return [];
  }

  const client = getClient();
  const endpoint = getEndpoint();

  const instances = validTexts.map(text =>
    helpers.toValue({
      content: text,
      taskType: "RETRIEVAL_DOCUMENT",
    })!
  );

  const parameters = helpers.toValue({
    outputDimensionality: EMBEDDING_DIMENSIONS,
  });

  const [response] = await client.predict({
    endpoint,
    instances,
    parameters,
  });

  if (!response.predictions || response.predictions.length === 0) {
    throw new Error("No embeddings returned from Vertex AI");
  }

  return response.predictions.map((prediction) => {
    const embeddingData = prediction?.structValue?.fields?.embeddings?.structValue?.fields?.values?.listValue?.values;
    if (!embeddingData) {
      throw new Error("Unexpected Vertex AI response structure");
    }
    return embeddingData.map((v) => v.numberValue ?? 0);
  });
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
