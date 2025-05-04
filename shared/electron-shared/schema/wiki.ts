import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";
import { users } from "./users";

export const wikiEntries = pgTable("wiki_entries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  creatorId: integer("creator_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  lastEditorId: integer("last_editor_id").references(() => users.id),
  category: text("category")
});

export const wikiCategories = pgTable("wiki_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  parentId: integer("parent_id"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull()
});

export const insertWikiEntrySchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  creatorId: z.number(),
  category: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastEditorId: z.number()
});

export type WikiEntry = typeof wikiEntries.$inferSelect;
export type InsertWikiEntry = typeof wikiEntries.$inferInsert;
