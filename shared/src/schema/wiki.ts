import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import {
  InferSelectModel,
  InferInsertModel,
} from "drizzle-orm";

// ---------- tables ----------
export const wikiCategories = pgTable("wiki_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  parentId: integer("parent_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const wikiEntries = pgTable("wiki_entries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  creatorId: integer("creator_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastEditorId: integer("last_editor_id"),
  category: text("category"),
});

// ---------- types ----------
export type WikiCategory       = InferSelectModel<typeof wikiCategories>;
export type InsertWikiCategory = InferInsertModel<typeof wikiCategories>;
export type WikiEntry          = InferSelectModel<typeof wikiEntries>;
export type InsertWikiEntry    = InferInsertModel<typeof wikiEntries>;