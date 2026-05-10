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
  tags: text("tags").default(""),
  isPinned: boolean("is_pinned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull().default("New Conversation"),
  messages: jsonb("messages").notNull().default('[]'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  title: true,
  messages: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export const insertMemorySchema = createInsertSchema(memories).pick({
  content: true,
  category: true,
  tags: true,
  isPinned: true,
});

export const memoryCategories = ["general", "personal", "work", "health", "learning"] as const;
export type MemoryCategory = typeof memoryCategories[number];

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
  ttsPitch: z.number().min(0.5).max(2).default(1),
  ttsEnabled: z.boolean().default(true),
  ttsVoiceName: z.string().default(""),
  musicVolume: z.number().min(0).max(1).default(0.5),
  musicLoop: z.boolean().default(true),
  musicAutoPlay: z.boolean().default(false),
  language: z.enum(["en", "hi", "ta", "te", "bn", "mr", "gu", "kn", "ml", "pa", "or", "as", "ur", "ne", "sa", "kok"]).default("en"),
  wallpaper: z.enum(["gradient", "peacock", "lotus", "tricolor", "mandala"]).default("gradient"),
  dcModeAuto: z.boolean().default(true),
  mustReadMemory: z.string().default(""),
  useCustomApiKey: z.boolean().default(false),
  customApiKey: z.string().default(""),
  useGroq: z.boolean().default(false),
  groqApiKey: z.string().default(""),
  groqModel: z.string().default("llama3-8b-8192"),
  fontSize: z.enum(["sm", "base", "lg", "xl"]).default("base"),
  glassBlur: z.enum(["low", "medium", "high", "ultra"]).default("medium"),
  animationSpeed: z.enum(["slow", "normal", "fast", "off"]).default("normal"),
  borderRadius: z.enum(["sharp", "sm", "md", "lg", "pill"]).default("lg"),
  soundEffectsEnabled: z.boolean().default(true),
  aiCreativity: z.enum(["precise", "balanced", "creative"]).default("balanced"),
  aiResponseLength: z.enum(["concise", "standard", "detailed"]).default("standard"),
  aiReasoningDepth: z.enum(["quick", "standard", "deep"]).default("standard"),
  enterToSend: z.boolean().default(true),
  autoScroll: z.boolean().default(true),
  showTimestamps: z.boolean().default(true),
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
  { quote: "Freedom is not worth having if it does not include the freedom to make mistakes.", author: "Mahatma Gandhi" },
  { quote: "A nation's culture resides in the hearts and in the soul of its people.", author: "Mahatma Gandhi" },
  { quote: "My life is my message.", author: "Mahatma Gandhi" },
  { quote: "Earth provides enough to satisfy every man's needs, but not every man's greed.", author: "Mahatma Gandhi" },
  { quote: "Man is but the product of his thoughts. What he thinks, he becomes.", author: "Mahatma Gandhi" },
  { quote: "I measure the progress of a community by the degree of progress which women have achieved.", author: "B.R. Ambedkar" },
  { quote: "Cultivation of mind should be the ultimate aim of human existence.", author: "B.R. Ambedkar" },
  { quote: "Life should be great rather than long.", author: "B.R. Ambedkar" },
  { quote: "A great man is different from an eminent one in that he is ready to be the servant of the society.", author: "B.R. Ambedkar" },
  { quote: "Men are mortal. So are ideas. An idea needs propagation as much as a plant needs watering.", author: "B.R. Ambedkar" },
  { quote: "In a gentle way, you can shake the world.", author: "Mahatma Gandhi" },
  { quote: "They may kill me, but they cannot kill my ideas.", author: "Bhagat Singh" },
  { quote: "Merciless criticism and independent thinking are the two necessary traits of revolutionary thinking.", author: "Bhagat Singh" },
  { quote: "Every tiny molecule of Ash is in motion with my heat I am such a Lunatic that I am free even in Jail.", author: "Bhagat Singh" },
  { quote: "I am a man and all that affects mankind concerns me.", author: "Bhagat Singh" },
  { quote: "Truth alone will endure, all the rest will be swept away before the tide of time.", author: "Mahatma Gandhi" },
  { quote: "The mind is everything. What you think you become.", author: "Buddha" },
  { quote: "Peace comes from within. Do not seek it without.", author: "Buddha" },
  { quote: "Three things cannot be long hidden: the sun, the moon, and the truth.", author: "Buddha" },
  { quote: "We can never obtain peace in the outer world until we make peace with ourselves.", author: "Dalai Lama" },
  { quote: "Where the mind is without fear and the head is held high.", author: "Rabindranath Tagore" },
  { quote: "You can't cross the sea merely by standing and staring at the water.", author: "Rabindranath Tagore" },
  { quote: "Everything comes to us that belongs to us if we create the capacity to receive it.", author: "Rabindranath Tagore" },
  { quote: "Let your life lightly dance on the edges of Time like dew on the tip of a leaf.", author: "Rabindranath Tagore" },
  { quote: "Faith is the bird that feels the light when the dawn is still dark.", author: "Rabindranath Tagore" },
  { quote: "Knowledge without action is useless and irrelevant.", author: "APJ Abdul Kalam" },
  { quote: "To succeed in your mission, you must have single-minded devotion to your goal.", author: "APJ Abdul Kalam" },
  { quote: "Failure will never overtake me if my determination to succeed is strong enough.", author: "APJ Abdul Kalam" },
  { quote: "Let us sacrifice our today so that our children can have a better tomorrow.", author: "APJ Abdul Kalam" },
  { quote: "Man needs his difficulties because they are necessary to enjoy success.", author: "APJ Abdul Kalam" },
  { quote: "Comfort is no test of truth. Truth is often far from being comfortable.", author: "Swami Vivekananda" },
  { quote: "The greatest religion is to be true to your own nature.", author: "Swami Vivekananda" },
  { quote: "Take up one idea. Make that one idea your life.", author: "Swami Vivekananda" },
  { quote: "In a conflict between the heart and the brain, follow your heart.", author: "Swami Vivekananda" },
  { quote: "Stand up, be bold, be strong. Take the whole responsibility on your own shoulders.", author: "Swami Vivekananda" },
  { quote: "Even if I die in the service of the nation, I would be proud of it.", author: "Indira Gandhi" },
  { quote: "There are two kinds of people, those who do the work and those who take the credit. Try to be in the first group; there is less competition there.", author: "Indira Gandhi" },
  { quote: "There is not a single instance in history where sword has won and sustained an empire.", author: "Sardar Vallabhbhai Patel" },
  { quote: "Every citizen of India must remember that... he is an Indian and he has every right in this country but with certain... duties.", author: "Sardar Vallabhbhai Patel" },
];

export type IndianQuote = typeof indianQuotes[number];

export const chatRequestSchema = z.object({
  message: z.string().min(1),
  personality: z.enum(["formal", "friendly", "professional", "teacher", "dc-mode"]).optional(),
  context: z.string().optional(),
  mustReadMemory: z.string().optional(),
  settings: z.any().optional(),
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
  language: z.enum(["en", "hi", "ta", "te", "bn", "mr", "gu", "kn", "ml", "pa", "or", "as", "ur", "ne", "sa", "kok"]).optional(),
});

export type DocumentAnalysis = z.infer<typeof documentAnalysisSchema>;
export type CodeAnalysis = z.infer<typeof codeAnalysisSchema>;
export type StudyRequest = z.infer<typeof studyRequestSchema>;
export type LanguageConvert = z.infer<typeof languageConvertSchema>;
export type SearchRequest = z.infer<typeof searchRequestSchema>;
export type ImageAnalysis = z.infer<typeof imageAnalysisSchema>;
export type CreativeRequest = z.infer<typeof creativeRequestSchema>;
