import { getClient } from "../reasoning/models";

export interface CacheEntry {
  cacheName: string;
  expiresAt: Date;
  contentHash: string;
}

const activeCaches = new Map<string, CacheEntry>();

/**
 * Compute hash of contents to determine cache hits locally.
 */
function hashString(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = (hash << 5) - hash + content.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

/**
 * Register or fetch a cached context from Gemini API.
 * Uses a TTL of 5 minutes by default.
 */
export async function getOrCreateContextCache(
  model: string,
  systemInstruction: string,
  content: string,
  apiKey?: string,
  ttlSeconds: number = 300
): Promise<string | undefined> {
  const contentHash = hashString(systemInstruction + "::" + content);
  const cacheKey = `${model}::${contentHash}`;

  const existing = activeCaches.get(cacheKey);
  if (existing && existing.expiresAt > new Date()) {
    return existing.cacheName;
  }

  try {
    const client = getClient(apiKey);
    
    // Create cache name or display name
    const displayName = `swadesh_cache_${contentHash}`;
    
    // Call client.caches.create
    // Note: contents can be formatted as parts or content objects
    const cache = await client.caches.create({
      model,
      config: {
        displayName,
        ttl: `${ttlSeconds}s`,
        systemInstruction,
        contents: [
          {
            role: "user",
            parts: [{ text: content }]
          }
        ]
      }
    });

    if (cache && cache.name) {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      activeCaches.set(cacheKey, {
        cacheName: cache.name,
        expiresAt,
        contentHash
      });
      console.log(`[CacheManager] Created context cache resource: ${cache.name} (expires: ${expiresAt.toISOString()})`);
      return cache.name;
    }
    
    return undefined;
  } catch (error) {
    console.warn("[CacheManager] Context caching not supported or failed:", error);
    return undefined;
  }
}

export function pruneExpiredLocalCaches() {
  const now = new Date();
  activeCaches.forEach((entry, key) => {
    if (entry.expiresAt <= now) {
      activeCaches.delete(key);
    }
  });
}
