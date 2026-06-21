import { storage } from "../storage";
import { generateEmbedding, cosineSimilarity } from "./embeddings";
import type { Source } from "@shared/schema";

/**
 * Computes keyword overlap ratio between query and chunk text.
 */
function calculateKeywordOverlap(query: string, text: string): number {
  const queryWords = new Set(
    query
      .toLowerCase()
      .split(/[^a-zA-Z0-9\u0900-\u097F]+/) // Support English + Devanagari characters
      .filter((w) => w.length > 2)
  );
  if (queryWords.size === 0) return 0;
  
  const textLower = text.toLowerCase();
  let matches = 0;
  const wordsArr = Array.from(queryWords);
  for (let i = 0; i < wordsArr.length; i++) {
    const word = wordsArr[i];
    if (textLower.includes(word)) {
      matches++;
    }
  }
  return matches / queryWords.size;
}

/**
 * Calculates exponential decay freshness score (1.0 on day 0, decaying based on age).
 */
function calculateFreshness(freshnessDate: Date): number {
  const diffTime = Math.abs(Date.now() - new Date(freshnessDate).getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  // 180-day half-life decay
  return Math.exp(-diffDays / 180);
}

export interface RetrievalResult {
  text: string;
  sourceName: string;
  sourceUrl: string;
  relevanceScore: number;
  page?: number;
  section?: string;
  trustScore: number;
  freshness: Date;
}

/**
 * Retrieve relevant chunks from private files using the hybrid relevance score formula.
 */
export async function retrievePrivateEvidence(
  query: string,
  workspaceId: string = "default",
  apiKey?: string
): Promise<RetrievalResult[]> {
  try {
    // 1. Generate query embedding vector
    const queryVec = await generateEmbedding(query, apiKey);

    // 2. Fetch all document chunks in this workspace
    const allChunks = await storage.getAllChunks(workspaceId);
    if (allChunks.length === 0) return [];

    // 3. Score each chunk using the metadata-enriched re-ranking model
    const results = allChunks.map((chunk) => {
      // Semantic similarity (normalize cosine similarity [-1, 1] to [0, 1] range)
      const semSim = cosineSimilarity(queryVec, chunk.embedding as number[]);
      const semanticSimilarity = (semSim + 1) / 2;

      const keywordOverlap = calculateKeywordOverlap(query, chunk.text);
      const sourceTrust = chunk.source.trustScore / 100;
      const freshness = calculateFreshness(chunk.source.freshness);
      
      // Document authority matches scope priorities
      const documentAuthority = chunk.source.scope === "private" ? 1.0 : 0.8;
      
      // Default user context match
      const userContextMatch = 1.0;

      // Formula from Swadesh AI Technical Moat paper
      const finalRelevance =
        semanticSimilarity * 0.45 +
        keywordOverlap * 0.15 +
        sourceTrust * 0.15 +
        freshness * 0.10 +
        documentAuthority * 0.10 +
        userContextMatch * 0.05;

      return {
        text: chunk.text,
        sourceName: chunk.source.name,
        sourceUrl: `/api/sources/${chunk.source.id}/view`,
        relevanceScore: finalRelevance,
        page: chunk.page || undefined,
        section: chunk.section || undefined,
        trustScore: chunk.source.trustScore,
        freshness: chunk.source.freshness,
      };
    });

    // 4. Filter out low relevance, sort descending, and return top 5 chunks
    return results
      .filter((r) => r.relevanceScore > 0.35)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);
  } catch (error) {
    console.error("Private document retrieval failed:", error);
    return [];
  }
}
