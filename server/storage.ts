import { 
  users, memories, conversations, sources, chunks, answerRuns, claims,
  type User, type UpsertUser, type Memory, type InsertMemory, type Conversation, type InsertConversation,
  type Source, type InsertSource, type Chunk, type InsertChunk, type AnswerRun, type InsertAnswerRun, type Claim, type InsertClaim
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserSetup(userId: string, setupCompleted: boolean): Promise<void>;
  
  getMemories(userId: string): Promise<Memory[]>;
  createMemory(userId: string, memory: InsertMemory): Promise<Memory>;
  updateMemory(id: string, userId: string, content: string): Promise<Memory | undefined>;
  deleteMemory(id: string, userId: string): Promise<boolean>;

  getConversations(userId: string): Promise<Conversation[]>;
  getConversation(id: string, userId: string): Promise<Conversation | undefined>;
  createConversation(userId: string, conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, userId: string, updates: Partial<InsertConversation>): Promise<Conversation | undefined>;
  deleteConversation(id: string, userId: string): Promise<boolean>;

  // Knowledge Fabric
  getSources(workspaceId: string): Promise<Source[]>;
  getSource(id: string): Promise<Source | undefined>;
  createSource(userId: string | null, workspaceId: string, source: InsertSource): Promise<Source>;
  deleteSource(id: string): Promise<boolean>;

  getChunks(sourceId: string): Promise<Chunk[]>;
  createChunks(chunksList: InsertChunk[]): Promise<Chunk[]>;
  getAllChunks(workspaceId: string): Promise<(Chunk & { source: Source })[]>;

  // Audit Logs & Claims
  createAnswerRun(userId: string | null, workspaceId: string, run: InsertAnswerRun): Promise<AnswerRun>;
  getAnswerRuns(workspaceId: string): Promise<AnswerRun[]>;
  getAnswerRun(id: string): Promise<AnswerRun | undefined>;
  
  createClaims(claimsList: InsertClaim[]): Promise<Claim[]>;
  getClaimsForRun(answerRunId: string): Promise<Claim[]>;
}

function requireDb() {
  if (!db) throw new Error("Database is not configured. Set DATABASE_URL in your .env file.");
  return db;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const d = requireDb();
    const [user] = await d.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const d = requireDb();
    const [user] = await d
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserSetup(userId: string, setupCompleted: boolean): Promise<void> {
    const d = requireDb();
    await d.update(users).set({ setupCompleted, updatedAt: new Date() }).where(eq(users.id, userId));
  }

  async getMemories(userId: string): Promise<Memory[]> {
    const d = requireDb();
    return await d.select().from(memories).where(eq(memories.userId, userId));
  }

  async createMemory(userId: string, memory: InsertMemory): Promise<Memory> {
    const d = requireDb();
    const [newMemory] = await d
      .insert(memories)
      .values({ ...memory, userId })
      .returning();
    return newMemory;
  }

  async updateMemory(id: string, userId: string, content: string): Promise<Memory | undefined> {
    const d = requireDb();
    const [existing] = await d.select().from(memories).where(eq(memories.id, id));
    if (!existing || existing.userId !== userId) return undefined;
    const [updated] = await d
      .update(memories)
      .set({ content, updatedAt: new Date() })
      .where(eq(memories.id, id))
      .returning();
    return updated;
  }

  async deleteMemory(id: string, userId: string): Promise<boolean> {
    const d = requireDb();
    const [existing] = await d.select().from(memories).where(eq(memories.id, id));
    if (!existing || existing.userId !== userId) return false;
    await d.delete(memories).where(eq(memories.id, id));
    return true;
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    const d = requireDb();
    return await d.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt));
  }

  async getConversation(id: string, userId: string): Promise<Conversation | undefined> {
    const d = requireDb();
    const [conversation] = await d.select().from(conversations).where(eq(conversations.id, id));
    if (!conversation || conversation.userId !== userId) return undefined;
    return conversation;
  }

  async createConversation(userId: string, conversation: InsertConversation): Promise<Conversation> {
    const d = requireDb();
    const [newConv] = await d
      .insert(conversations)
      .values({ ...conversation, userId })
      .returning();
    return newConv;
  }

  async updateConversation(id: string, userId: string, updates: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const d = requireDb();
    const [existing] = await d.select().from(conversations).where(eq(conversations.id, id));
    if (!existing || existing.userId !== userId) return undefined;
    const [updated] = await d
      .update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return updated;
  }

  async deleteConversation(id: string, userId: string): Promise<boolean> {
    const d = requireDb();
    const [existing] = await d.select().from(conversations).where(eq(conversations.id, id));
    if (!existing || existing.userId !== userId) return false;
    await d.delete(conversations).where(eq(conversations.id, id));
    return true;
  }

  // Knowledge Fabric Database Implementation
  async getSources(workspaceId: string): Promise<Source[]> {
    const d = requireDb();
    return await d.select().from(sources).where(eq(sources.workspaceId, workspaceId)).orderBy(desc(sources.createdAt));
  }

  async getSource(id: string): Promise<Source | undefined> {
    const d = requireDb();
    const [source] = await d.select().from(sources).where(eq(sources.id, id));
    return source || undefined;
  }

  async createSource(userId: string | null, workspaceId: string, sourceData: InsertSource): Promise<Source> {
    const d = requireDb();
    const [source] = await d
      .insert(sources)
      .values({ ...sourceData, userId, workspaceId })
      .returning();
    return source;
  }

  async deleteSource(id: string): Promise<boolean> {
    const d = requireDb();
    const [existing] = await d.select().from(sources).where(eq(sources.id, id));
    if (!existing) return false;
    await d.delete(sources).where(eq(sources.id, id));
    return true;
  }

  async getChunks(sourceId: string): Promise<Chunk[]> {
    const d = requireDb();
    return await d.select().from(chunks).where(eq(chunks.sourceId, sourceId));
  }

  async createChunks(chunksList: InsertChunk[]): Promise<Chunk[]> {
    const d = requireDb();
    if (chunksList.length === 0) return [];
    return await d.insert(chunks).values(chunksList).returning();
  }

  async getAllChunks(workspaceId: string): Promise<(Chunk & { source: Source })[]> {
    const d = requireDb();
    const results = await d
      .select()
      .from(chunks)
      .innerJoin(sources, eq(chunks.sourceId, sources.id))
      .where(eq(sources.workspaceId, workspaceId));
    
    return results.map(r => ({
      ...r.chunks,
      source: r.sources
    }));
  }

  // Audit Logs Database Implementation
  async createAnswerRun(userId: string | null, workspaceId: string, runData: InsertAnswerRun): Promise<AnswerRun> {
    const d = requireDb();
    const [run] = await d
      .insert(answerRuns)
      .values({ ...runData, userId, workspaceId })
      .returning();
    return run;
  }

  async getAnswerRuns(workspaceId: string): Promise<AnswerRun[]> {
    const d = requireDb();
    return await d.select().from(answerRuns).where(eq(answerRuns.workspaceId, workspaceId)).orderBy(desc(answerRuns.createdAt));
  }

  async getAnswerRun(id: string): Promise<AnswerRun | undefined> {
    const d = requireDb();
    const [run] = await d.select().from(answerRuns).where(eq(answerRuns.id, id));
    return run || undefined;
  }

  async createClaims(claimsList: InsertClaim[]): Promise<Claim[]> {
    const d = requireDb();
    if (claimsList.length === 0) return [];
    return await d.insert(claims).values(claimsList).returning();
  }

  async getClaimsForRun(answerRunId: string): Promise<Claim[]> {
    const d = requireDb();
    return await d.select().from(claims).where(eq(claims.answerRunId, answerRunId));
  }
}

export class MemStorage implements IStorage {
  private usersMap = new Map<string, User>();
  private memoriesMap = new Map<string, Memory>();
  private conversationsMap = new Map<string, Conversation>();
  private sourcesMap = new Map<string, Source>();
  private chunksMap = new Map<string, Chunk>();
  private answerRunsMap = new Map<string, AnswerRun>();
  private claimsMap = new Map<string, Claim>();

  async getUser(id: string): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const user: User = {
      id: userData.id || Math.random().toString(36).substring(7),
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      setupCompleted: userData.setupCompleted ?? false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.usersMap.set(user.id, user);
    return user;
  }

  async updateUserSetup(userId: string, setupCompleted: boolean): Promise<void> {
    const user = this.usersMap.get(userId);
    if (user) {
      user.setupCompleted = setupCompleted;
      user.updatedAt = new Date();
      this.usersMap.set(userId, user);
    }
  }

  async getMemories(userId: string): Promise<Memory[]> {
    return Array.from(this.memoriesMap.values()).filter(m => m.userId === userId);
  }

  async createMemory(userId: string, memory: InsertMemory): Promise<Memory> {
    const newMemory: Memory = {
      id: Math.random().toString(36).substring(7),
      userId,
      content: memory.content,
      category: memory.category || "general",
      tags: memory.tags || "",
      isPinned: memory.isPinned ?? false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.memoriesMap.set(newMemory.id, newMemory);
    return newMemory;
  }

  async updateMemory(id: string, userId: string, content: string): Promise<Memory | undefined> {
    const existing = this.memoriesMap.get(id);
    if (!existing || existing.userId !== userId) return undefined;
    existing.content = content;
    existing.updatedAt = new Date();
    this.memoriesMap.set(id, existing);
    return existing;
  }

  async deleteMemory(id: string, userId: string): Promise<boolean> {
    const existing = this.memoriesMap.get(id);
    if (!existing || existing.userId !== userId) return false;
    this.memoriesMap.delete(id);
    return true;
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    return Array.from(this.conversationsMap.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => b.updatedAt!.getTime() - a.updatedAt!.getTime());
  }

  async getConversation(id: string, userId: string): Promise<Conversation | undefined> {
    const conv = this.conversationsMap.get(id);
    if (!conv || conv.userId !== userId) return undefined;
    return conv;
  }

  async createConversation(userId: string, conversation: InsertConversation): Promise<Conversation> {
    const newConv: Conversation = {
      id: Math.random().toString(36).substring(7),
      userId,
      title: conversation.title || "New Conversation",
      messages: conversation.messages ?? [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.conversationsMap.set(newConv.id, newConv);
    return newConv;
  }

  async updateConversation(id: string, userId: string, updates: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const existing = this.conversationsMap.get(id);
    if (!existing || existing.userId !== userId) return undefined;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    this.conversationsMap.set(id, updated);
    return updated;
  }

  async deleteConversation(id: string, userId: string): Promise<boolean> {
    const existing = this.conversationsMap.get(id);
    if (!existing || existing.userId !== userId) return false;
    this.conversationsMap.delete(id);
    return true;
  }

  // Knowledge Fabric Memory Implementation
  async getSources(workspaceId: string): Promise<Source[]> {
    return Array.from(this.sourcesMap.values())
      .filter(s => s.workspaceId === workspaceId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getSource(id: string): Promise<Source | undefined> {
    return this.sourcesMap.get(id);
  }

  async createSource(userId: string | null, workspaceId: string, sourceData: InsertSource): Promise<Source> {
    const source: Source = {
      id: Math.random().toString(36).substring(7),
      userId,
      workspaceId,
      name: sourceData.name,
      type: sourceData.type,
      owner: sourceData.owner ?? "System",
      scope: sourceData.scope ?? "private",
      trustScore: sourceData.trustScore ?? 100,
      freshness: new Date(),
      versionHash: sourceData.versionHash,
      tokenCount: sourceData.tokenCount ?? 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.sourcesMap.set(source.id, source);
    return source;
  }

  async deleteSource(id: string): Promise<boolean> {
    const existing = this.sourcesMap.has(id);
    if (!existing) return false;
    this.sourcesMap.delete(id);
    // clean up chunks too
    this.chunksMap.forEach((chunk, chunkId) => {
      if (chunk.sourceId === id) {
        this.chunksMap.delete(chunkId);
      }
    });
    return true;
  }

  async getChunks(sourceId: string): Promise<Chunk[]> {
    return Array.from(this.chunksMap.values()).filter(c => c.sourceId === sourceId);
  }

  async createChunks(chunksList: InsertChunk[]): Promise<Chunk[]> {
    const created: Chunk[] = [];
    for (const c of chunksList) {
      const chunk: Chunk = {
        id: Math.random().toString(36).substring(7),
        sourceId: c.sourceId,
        text: c.text,
        embedding: c.embedding as number[],
        page: c.page ?? null,
        section: c.section ?? null,
        tokenCount: c.tokenCount ?? 0,
        createdAt: new Date()
      };
      this.chunksMap.set(chunk.id, chunk);
      created.push(chunk);
    }
    return created;
  }

  async getAllChunks(workspaceId: string): Promise<(Chunk & { source: Source })[]> {
    const matchingSources = Array.from(this.sourcesMap.values()).filter(s => s.workspaceId === workspaceId);
    const sourceIds = new Set(matchingSources.map(s => s.id));
    const result: (Chunk & { source: Source })[] = [];
    
    this.chunksMap.forEach((chunk) => {
      if (sourceIds.has(chunk.sourceId)) {
        const source = this.sourcesMap.get(chunk.sourceId)!;
        result.push({
          ...chunk,
          source
        });
      }
    });
    return result;
  }

  // Audit Logs Memory Implementation
  async createAnswerRun(userId: string | null, workspaceId: string, runData: InsertAnswerRun): Promise<AnswerRun> {
    const run: AnswerRun = {
      id: Math.random().toString(36).substring(7),
      userId,
      workspaceId,
      question: runData.question,
      mode: runData.mode,
      taskType: runData.taskType,
      model: runData.model,
      executionMode: runData.executionMode,
      fallbackUsed: runData.fallbackUsed ?? false,
      confidenceScore: runData.confidenceScore ?? 0,
      confidenceLabel: runData.confidenceLabel ?? "Low Confidence",
      timing: runData.timing || {},
      criticFindings: runData.criticFindings ?? [],
      createdAt: new Date()
    };
    this.answerRunsMap.set(run.id, run);
    return run;
  }

  async getAnswerRuns(workspaceId: string): Promise<AnswerRun[]> {
    return Array.from(this.answerRunsMap.values())
      .filter(r => r.workspaceId === workspaceId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getAnswerRun(id: string): Promise<AnswerRun | undefined> {
    return this.answerRunsMap.get(id);
  }

  async createClaims(claimsList: InsertClaim[]): Promise<Claim[]> {
    const created: Claim[] = [];
    for (const c of claimsList) {
      const claim: Claim = {
        id: Math.random().toString(36).substring(7),
        answerRunId: c.answerRunId,
        text: c.text,
        supportLevel: c.supportLevel ?? "strong",
        sourceIds: c.sourceIds ?? [],
        criticFlags: c.criticFlags ?? [],
        createdAt: new Date()
      };
      this.claimsMap.set(claim.id, claim);
      created.push(claim);
    }
    return created;
  }

  async getClaimsForRun(answerRunId: string): Promise<Claim[]> {
    return Array.from(this.claimsMap.values()).filter(c => c.answerRunId === answerRunId);
  }
}

export const storage = db ? new DatabaseStorage() : new MemStorage();
