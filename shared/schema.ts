import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  setupCompleted: boolean("setup_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const memories = pgTable("memories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  category: varchar("category").default("general"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMemorySchema = createInsertSchema(memories).pick({
  content: true,
  category: true,
});

export type InsertMemory = z.infer<typeof insertMemorySchema>;
export type Memory = typeof memories.$inferSelect;

export const chatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.number(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const aiToolTypes = [
  "document-master",
  "code-lab",
  "study-pro",
  "language-converter",
  "search-engine",
  "voice-ops",
  "image-vision",
  "video-brain",
  "swadesh-daily",
  "productivity",
  "creative-tools",
] as const;

export type AIToolType = typeof aiToolTypes[number];

export const settingsSchema = z.object({
  theme: z.enum(["light", "dark"]).default("dark"),
  personality: z.enum(["formal", "friendly", "professional", "teacher", "dc-mode"]).default("friendly"),
  ttsSpeed: z.number().min(0.5).max(2).default(1),
  ttsEnabled: z.boolean().default(true),
  musicVolume: z.number().min(0).max(1).default(0.5),
  musicLoop: z.boolean().default(true),
  musicAutoPlay: z.boolean().default(false),
  language: z.enum(["en", "hi", "ta", "te", "bn"]).default("en"),
  wallpaper: z.enum(["gradient", "peacock", "lotus", "tricolor", "mandala"]).default("gradient"),
  dcModeAuto: z.boolean().default(true),
});

export type Settings = z.infer<typeof settingsSchema>;

export const todoItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean(),
  createdAt: z.number(),
  reminder: z.number().optional(),
});

export type TodoItem = z.infer<typeof todoItemSchema>;

export const noteSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Note = z.infer<typeof noteSchema>;

export const voiceNoteSchema = z.object({
  id: z.string(),
  audioUrl: z.string(),
  transcript: z.string().optional(),
  createdAt: z.number(),
  duration: z.number(),
});

export type VoiceNote = z.infer<typeof voiceNoteSchema>;

export const indianQuotes = [
  { quote: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { quote: "Arise, awake, and stop not till the goal is reached.", author: "Swami Vivekananda" },
  { quote: "You must be the change you wish to see in the world.", author: "Mahatma Gandhi" },
  { quote: "Take risks in your life. If you win, you can lead; if you lose, you can guide.", author: "Swami Vivekananda" },
  { quote: "The best way to find yourself is to lose yourself in the service of others.", author: "Mahatma Gandhi" },
  { quote: "In a gentle way, you can shake the world.", author: "Mahatma Gandhi" },
  { quote: "Talk to yourself once in a day, otherwise you may miss meeting an excellent person in this world.", author: "Swami Vivekananda" },
  { quote: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Mahatma Gandhi" },
  { quote: "Learn from yesterday, live for today, hope for tomorrow.", author: "APJ Abdul Kalam" },
  { quote: "Dream is not that which you see while sleeping, it is something that does not let you sleep.", author: "APJ Abdul Kalam" },
  { quote: "You have to dream before your dreams can come true.", author: "APJ Abdul Kalam" },
  { quote: "If you want to shine like a sun, first burn like a sun.", author: "APJ Abdul Kalam" },
  { quote: "We are what our thoughts have made us; so take care about what you think.", author: "Swami Vivekananda" },
  { quote: "All power is within you; you can do anything and everything.", author: "Swami Vivekananda" },
  { quote: "The only way to do great work is to love what you do.", author: "Sardar Vallabhbhai Patel" },
];

export type IndianQuote = typeof indianQuotes[number];

export const chatRequestSchema = z.object({
  message: z.string().min(1),
  personality: z.enum(["formal", "friendly", "professional", "teacher", "dc-mode"]).optional(),
  context: z.string().optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const documentAnalysisSchema = z.object({
  content: z.string(),
  action: z.enum(["summarize", "explain", "translate", "extract-notes", "highlight"]),
  targetLanguage: z.string().optional(),
});

export const codeAnalysisSchema = z.object({
  code: z.string(),
  action: z.enum(["generate", "debug", "optimize", "explain"]),
  language: z.string().optional(),
  prompt: z.string().optional(),
});

export const studyRequestSchema = z.object({
  topic: z.string(),
  action: z.enum(["ncert-solution", "mcq-generate", "long-answer", "math-solve", "explain-diagram"]),
  grade: z.string().optional(),
  subject: z.string().optional(),
});

export const languageConvertSchema = z.object({
  text: z.string(),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
  transliterate: z.boolean().optional(),
});

export const searchRequestSchema = z.object({
  query: z.string(),
  type: z.enum(["general", "news", "academic"]).optional(),
});

export const imageAnalysisSchema = z.object({
  imageBase64: z.string(),
  action: z.enum(["ocr", "detect-objects", "analyze-scene", "extract-text"]),
});

export const creativeRequestSchema = z.object({
  type: z.enum(["script", "story", "poem", "video-idea"]),
  prompt: z.string(),
  language: z.enum(["en", "hi"]).optional(),
});

export type DocumentAnalysis = z.infer<typeof documentAnalysisSchema>;
export type CodeAnalysis = z.infer<typeof codeAnalysisSchema>;
export type StudyRequest = z.infer<typeof studyRequestSchema>;
export type LanguageConvert = z.infer<typeof languageConvertSchema>;
export type SearchRequest = z.infer<typeof searchRequestSchema>;
export type ImageAnalysis = z.infer<typeof imageAnalysisSchema>;
export type CreativeRequest = z.infer<typeof creativeRequestSchema>;
