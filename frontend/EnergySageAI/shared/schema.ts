import { sql } from "drizzle-orm";
import { pgTable, text, integer, timestamp, jsonb, varchar, vector, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ========================================
// REPLIT AUTH TABLES (REQUIRED)
// ========================================

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// ========================================
// APPLICATION TABLES
// ========================================

// Contacts table for lead generation
export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message"),
  language: varchar("language", { length: 2 }).notNull().default("cs"), // cs or sk
  gdprConsent: integer("gdpr_consent").notNull().default(1), // 1 = true
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
}).extend({
  name: z.string().min(2, "Jméno musí mít alespoň 2 znaky"),
  email: z.string().email("Neplatná emailová adresa"),
  phone: z.string().optional(),
  message: z.string().optional(),
  language: z.enum(["cs", "sk"]).default("cs"),
  gdprConsent: z.number().refine((val) => val === 1, "Musíte souhlasit se zpracováním osobních údajů"),
});

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

// Chat messages table (stores conversation history)
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  hasImage: integer("has_image").notNull().default(0), // 1 if message contains image
  hasLink: integer("has_link").notNull().default(0), // 1 if message contains link
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
}).extend({
  role: z.enum(["user", "assistant"]),
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// ========================================
// AI KNOWLEDGE BASE TABLES
// ========================================

// Documents - znalostní články o elektřině, TDD, spotových cenách
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  content: text("content").notNull(), // Markdown nebo plain text
  category: varchar("category", { length: 50 }).notNull(), // 'electricity', 'tdd', 'savings', 'faq'
  language: varchar("language", { length: 2 }).notNull().default("cs"), // cs or sk
  metadata: jsonb("metadata"), // Dodatečná data (autor, zdroj, datum publikace)
  isActive: integer("is_active").notNull().default(1), // 1 = aktivní, 0 = archivovaný
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// Embeddings - vector embeddings pro semantic search (RAG)
// Poznámka: pgvector extension musí být povolena v databázi
export const embeddings = pgTable("embeddings", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  documentId: varchar("document_id", { length: 255 }).notNull().references(() => documents.id, { onDelete: 'cascade' }),
  chunkText: text("chunk_text").notNull(), // Text chunk pro který je embedding
  chunkIndex: integer("chunk_index").notNull(), // Pozice chunku v dokumentu
  embedding: vector("embedding", { dimensions: 1536 }), // OpenAI ada-002 má 1536 dimensions
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEmbeddingSchema = createInsertSchema(embeddings).omit({
  id: true,
  createdAt: true,
});

export type InsertEmbedding = z.infer<typeof insertEmbeddingSchema>;
export type Embedding = typeof embeddings.$inferSelect;

// Conversations - celé konverzace s metadaty pro analytics
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  language: varchar("language", { length: 2 }).notNull().default("cs"),
  messageCount: integer("message_count").notNull().default(0),
  metadata: jsonb("metadata"), // User agent, location, referrer atd
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
