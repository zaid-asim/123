import { MODELS, getClient } from "./models";

export interface EvidenceSource {
  title: string;
  url: string;
  snippet: string;
}

export interface EvidenceBundle {
  synthesis: string;
  sources: EvidenceSource[];
  sourceCount: number;
  sourceAgreement: number; // 0-100 score on how consistent the sources seem
  contradictionsFound: string[];
}

export async function retrieveEvidence(
  searchQueries: string[],
  depth: number, // 1-10
  apiKey?: string
): Promise<EvidenceBundle> {
  if (searchQueries.length === 0) {
    return {
      synthesis: "",
      sources: [],
      sourceCount: 0,
      sourceAgreement: 100,
      contradictionsFound: [],
    };
  }

  // Limit search queries based on depth
  let maxQueries = 2;
  if (depth >= 4 && depth <= 7) maxQueries = 4;
  if (depth >= 8) maxQueries = 7;
  const queriesToRun = searchQueries.slice(0, maxQueries);

  const client = getClient(apiKey);
  const results = await Promise.all(
    queriesToRun.map(async (query, idx) => {
      try {
        if (idx > 0) {
          await new Promise(resolve => setTimeout(resolve, idx * 50));
        }
        const response = await client.models.generateContent({
          model: MODELS.PRIMARY,
          contents: `Synthesize facts and current knowledge for query: ${query}. Focus on raw facts.`,
          config: {
            systemInstruction: "You are a research bot. Summarize web search facts clearly and objectively.",
            tools: [{ googleSearch: {} }] as any,
            maxOutputTokens: 500
          },
        });

        const text = response.text || "";
        const chunks: EvidenceSource[] = [];
        
        try {
          const candidates = (response as any).candidates?.[0];
          const grounding = candidates?.groundingMetadata?.groundingChunks;
          if (grounding && grounding.length > 0) {
            for (const chunk of grounding) {
              if (chunk.web) {
                chunks.push({
                  title: chunk.web.title || "Web Source",
                  url: chunk.web.uri || "#",
                  snippet: `Grounding search result for: ${query}`
                });
              }
            }
          }
        } catch (e) {
          console.error("Error parsing grounding chunk", e);
        }

        return { text, chunks };
      } catch (err) {
        console.error(`Search failed for query "${query}":`, err);
        return { text: "", chunks: [] };
      }
    })
  );

  // Merge syntheses
  const syntheses = results.map(r => r.text).filter(Boolean);
  const combinedSynthesis = syntheses.join("\n\n");

  // Merge and deduplicate sources by URL
  const sourceMap = new Map<string, EvidenceSource>();
  for (const r of results) {
    for (const chunk of r.chunks) {
      if (chunk.url && chunk.url !== "#") {
        sourceMap.set(chunk.url, chunk);
      }
    }
  }
  const uniqueSources = Array.from(sourceMap.values());

  // Detect contradictions (look for words like "however", "contradict", "disagree", "versus", "conflict" in syntheses)
  const contradictions: string[] = [];
  const textLower = combinedSynthesis.toLowerCase();
  if (textLower.includes("contradict") || textLower.includes("conflict") || textLower.includes("disagreement") || textLower.includes("opposing view")) {
    // Run a quick analysis to extract conflicts
    try {
      const conflictResponse = await client.models.generateContent({
        model: MODELS.PRIMARY,
        contents: `Given these research syntheses, identify any key contradictions or disagreements between sources. Output them as a bulleted list. If none, output "None".\n\nSyntheses:\n${combinedSynthesis}`,
        config: {
          maxOutputTokens: 300
        }
      });
      const text = conflictResponse.text || "";
      if (text && !text.toLowerCase().includes("none")) {
        contradictions.push(...text.split("\n").map(l => l.replace(/^[-*]\s*/, "").trim()).filter(Boolean));
      }
    } catch (e) {
      // ignore
    }
  }

  // Calculate agreement
  let sourceAgreement = 100;
  if (contradictions.length > 0) {
    sourceAgreement = Math.max(30, 100 - contradictions.length * 15);
  }

  return {
    synthesis: combinedSynthesis,
    sources: uniqueSources.length > 0 ? uniqueSources : [
      { title: "Swadesh AI Knowledge Base", url: "https://swadesh.ai", snippet: "Powered by Swadesh AI" }
    ],
    sourceCount: uniqueSources.length,
    sourceAgreement,
    contradictionsFound: contradictions,
  };
}
