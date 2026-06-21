import * as cryptoNode from "crypto";
import { InsertSource, InsertChunk } from "@shared/schema";
import { generateEmbedding } from "./embeddings";

/**
 * Split text into chunks of roughly ~500 tokens (approx 2000 chars) with ~200 chars overlap.
 */
export function chunkText(text: string, chunkSize: number = 2000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  if (!text) return chunks;
  
  let index = 0;
  while (index < text.length) {
    // Avoid splitting in the middle of a word if possible
    let end = index + chunkSize;
    if (end < text.length) {
      const nextSpace = text.indexOf(" ", end);
      if (nextSpace !== -1 && nextSpace - end < 50) {
        end = nextSpace;
      }
    } else {
      end = text.length;
    }
    
    chunks.push(text.slice(index, end).trim());
    
    if (end === text.length) break;
    index = end - overlap;
    if (index < 0) index = 0;
    if (index >= text.length) break;
  }
  return chunks;
}

/**
 * Calculate trust score based on document properties.
 */
export function calculateTrustScore(fileType: string, fileSize: number): number {
  let score = 80;
  if (fileType === "json" || fileType === "csv") score = 95; // Highly structured
  if (fileType === "md" || fileType === "txt") score = 90;   // Human-curated markdown/text
  if (fileType === "pdf") score = 85;                        // Standard documents
  if (fileType === "docx") score = 80;                       // Office documents

  // Apply minor size-based penalty for extremely large files (noise risk)
  if (fileSize > 10 * 1024 * 1024) {
    score -= 10;
  } else if (fileSize > 2 * 1024 * 1024) {
    score -= 5;
  }

  return Math.min(100, Math.max(10, score));
}

/**
 * Compute SHA-256 hash of a file buffer to track version lineage.
 */
export function computeVersionHash(buffer: Buffer): string {
  return cryptoNode.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Parse text from a file buffer depending on file extension.
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  fileType: 'txt' | 'md' | 'csv' | 'json' | 'pdf' | 'docx',
  filename: string
): Promise<string> {
  switch (fileType) {
    case "txt":
    case "md":
      return buffer.toString("utf-8");
      
    case "json": {
      try {
        const obj = JSON.parse(buffer.toString("utf-8"));
        return JSON.stringify(obj, null, 2);
      } catch (e) {
        return buffer.toString("utf-8");
      }
    }
    
    case "csv":
      return buffer.toString("utf-8");
      
    case "pdf": {
      try {
        // Dynamically import pdf-parse if available
        const pdfParse = (await import("pdf-parse" as any)).default;
        const data = await pdfParse(buffer);
        return data.text || "";
      } catch (err) {
        console.warn("pdf-parse is not installed or failed, using binary-to-text fallback:", err);
        return stripBinaryText(buffer);
      }
    }
    
    case "docx": {
      try {
        // Dynamically import mammoth if available
        const mammoth = await import("mammoth" as any);
        const result = await mammoth.extractRawText({ buffer });
        return result.value || "";
      } catch (err) {
        console.warn("mammoth is not installed or failed, using binary-to-text fallback:", err);
        return stripBinaryText(buffer);
      }
    }
    
    default:
      return buffer.toString("utf-8");
  }
}

/**
 * Simple fallback utility to extract readable ASCII/UTF-8 strings from binary buffers.
 */
function stripBinaryText(buffer: Buffer): string {
  let text = "";
  let word = "";
  for (let i = 0; i < buffer.length; i++) {
    const charCode = buffer[i];
    // ASCII printable characters plus common spaces/newlines
    if ((charCode >= 32 && charCode <= 126) || charCode === 10 || charCode === 13 || charCode === 9) {
      word += String.fromCharCode(charCode);
    } else {
      if (word.length > 4) {
        text += word + " ";
      }
      word = "";
    }
  }
  if (word.length > 4) {
    text += word;
  }
  // Remove multiple spaces and filter clean sentences
  return text.replace(/\s+/g, " ").trim();
}
