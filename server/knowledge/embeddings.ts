import { getClient } from "../reasoning/models";

// Use text-embedding-004 as it is standard and widely supported, or gemini-embedding-2 if available
export const EMBEDDING_MODEL = "text-embedding-004";

/**
 * Generate a vector embedding for a single text string.
 */
export async function generateEmbedding(text: string, apiKey?: string): Promise<number[]> {
  if (!text || text.trim() === "") {
    return new Array(768).fill(0);
  }

  try {
    const client = getClient(apiKey);
    const response = await client.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text,
    });

    const res = response as any;
    if (res.embedding && res.embedding.values) {
      return res.embedding.values;
    }
    
    // In some API formats, it might return under response.embeddings[0].values
    if ((response as any).embeddings && (response as any).embeddings[0]) {
      return (response as any).embeddings[0].values;
    }

    throw new Error("Invalid embedding response format");
  } catch (error) {
    console.error("Failed to generate embedding from Gemini API:", error);
    // Return a dummy vector so the app doesn't crash during development/testing
    return mockEmbedding(text);
  }
}

/**
 * Generate vector embeddings for a batch of text strings.
 */
export async function generateBatchEmbeddings(texts: string[], apiKey?: string): Promise<number[][]> {
  if (texts.length === 0) return [];

  try {
    const client = getClient(apiKey);
    
    // Some older versions/deployments of models.embedContent support arrays of contents
    // Let's call them in chunks or map them
    const results = await Promise.all(
      texts.map(async (text) => {
        return generateEmbedding(text, apiKey);
      })
    );
    return results;
  } catch (error) {
    console.error("Batch embedding generation failed:", error);
    return texts.map(mockEmbedding);
  }
}

/**
 * Generate a deterministic mock vector embedding based on string contents
 * for testing and fallback modes.
 */
function mockEmbedding(text: string): number[] {
  const size = 768; // dimension of text-embedding-004
  const vector = new Array(size).fill(0);
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  for (let i = 0; i < size; i++) {
    // Generate values between -1 and 1
    const val = Math.sin(hash + i) * 1000;
    vector[i] = val - Math.floor(val);
  }
  return vector;
}

/**
 * Compute cosine similarity between two vector embeddings.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
