import { ReasonedAnswer } from "@shared/schema";

export function computeConfidence(
  evidence: { sourceCount: number; sourceAgreement: number; averageTrust?: number; youngestAgeDays?: number },
  verification: { overallConsistency: number; flaggedClaimsCount: number },
  critic: { assessment: 'pass' | 'revise' | 'fail'; criticalCount: number; warningCount: number },
  ensemble: { agreement: number } | null,
  metacognition: { knownUnknownsCount: number; potentialBiasesCount: number },
  depth: string
): ReasonedAnswer["confidence"] {
  // 1. Source Quality Score (0-100): based on average trust score of sources
  const sourceQualityScore = evidence.averageTrust !== undefined ? evidence.averageTrust : (evidence.sourceCount > 0 ? 85 : 50);

  // 2. Retrieval Relevance Score (0-100): based on source agreement
  const retrievalRelevanceScore = evidence.sourceAgreement;

  // 3. Citation Coverage Score (0-100): based on verification consistency and flagged claims
  const citationCoverageScore = Math.max(0, verification.overallConsistency - (verification.flaggedClaimsCount * 10));

  // 4. Critic Pass Score (0-100): based on critic assessment and issues count
  let criticPassScore = 100;
  if (critic.assessment === "revise") criticPassScore = 60;
  if (critic.assessment === "fail") criticPassScore = 20;
  criticPassScore = Math.max(0, criticPassScore - (critic.criticalCount * 15 + critic.warningCount * 5));

  // 5. Freshness Score (0-100): based on youngest source age in days
  const youngestAge = evidence.youngestAgeDays !== undefined ? evidence.youngestAgeDays : 0;
  const freshnessScore = Math.round(100 * Math.exp(-youngestAge / 180));

  // 6. Model Consistency Score (0-100): based on ensemble agreement
  const modelConsistencyScore = ensemble ? ensemble.agreement : 100;

  // Compute final weighted confidence score using formula from technical paper
  const score =
    sourceQualityScore * 0.25 +
    retrievalRelevanceScore * 0.20 +
    citationCoverageScore * 0.20 +
    criticPassScore * 0.20 +
    freshnessScore * 0.10 +
    modelConsistencyScore * 0.05;

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  let level: ReasonedAnswer["confidence"]["level"] = "Likely";
  if (finalScore >= 80) level = "Verified";
  else if (finalScore >= 60) level = "Likely";
  else if (finalScore >= 40) level = "Uncertain";
  else level = "Low Confidence";

  return {
    score: finalScore,
    level,
    factors: {
      evidenceScore: Math.round(sourceQualityScore),
      verificationScore: Math.round(citationCoverageScore),
      criticScore: Math.round(criticPassScore),
      ensembleScore: Math.round(modelConsistencyScore),
      metacognitionScore: Math.round(Math.max(0, 100 - (metacognition.knownUnknownsCount * 10 + metacognition.potentialBiasesCount * 5))),
    }
  };
}
