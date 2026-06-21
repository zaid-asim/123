import { storage } from "../storage";
import type { InsertAnswerRun, InsertClaim } from "@shared/schema";

export interface AuditData {
  question: string;
  mode: string;
  taskType: string;
  model: string;
  executionMode: string;
  fallbackUsed: boolean;
  confidenceScore: number;
  confidenceLabel: string;
  timing: {
    routing: number;
    retrieval: number;
    candidates: number;
    refine: number;
    verification: number;
    critic: number;
    ensemble: number;
    metacognition: number;
    total: number;
  };
  criticFindings: any[];
  claims: Array<{
    text: string;
    supportLevel: string;
    sourceIds?: string[];
    criticFlags?: string[];
  }>;
}

/**
 * Audit every execution run of the reasoning pipeline.
 * Saves the run details and extracted claim verifications.
 */
export async function logAnswerRun(
  userId: string | null,
  workspaceId: string,
  data: AuditData
) {
  try {
    // 1. Create the primary AnswerRun record
    const run = await storage.createAnswerRun(userId, workspaceId, {
      question: data.question,
      mode: data.mode,
      taskType: data.taskType,
      model: data.model,
      executionMode: data.executionMode,
      fallbackUsed: data.fallbackUsed,
      confidenceScore: data.confidenceScore,
      confidenceLabel: data.confidenceLabel,
      timing: data.timing,
      criticFindings: data.criticFindings,
    });

    // 2. Create claim-level verification records referencing the run ID
    if (data.claims && data.claims.length > 0) {
      const claimInserts: InsertClaim[] = data.claims.map((c) => ({
        answerRunId: run.id,
        text: c.text,
        supportLevel: c.supportLevel || "strong",
        sourceIds: c.sourceIds || [],
        criticFlags: c.criticFlags || [],
      }));
      await storage.createClaims(claimInserts);
    }

    console.log(`[AuditService] Successfully logged answer run ${run.id} for workspace "${workspaceId}"`);
    return run;
  } catch (error) {
    console.error("[AuditService] Failed to log answer run audit:", error);
    return null;
  }
}
