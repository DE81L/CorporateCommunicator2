"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertWikiEntrySchema = exports.wikiCategories = exports.wikiEntries = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const zod_1 = require("zod");
const users_1 = require("./users");
exports.wikiEntries = (0, pg_core_1.pgTable)("wiki_entries", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    title: (0, pg_core_1.text)("title").notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    creatorId: (0, pg_core_1.integer)("creator_id").references(() => users_1.users.id),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").notNull(),
    lastEditorId: (0, pg_core_1.integer)("last_editor_id").references(() => users_1.users.id),
    category: (0, pg_core_1.text)("category")
});
exports.wikiCategories = (0, pg_core_1.pgTable)("wiki_categories", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    description: (0, pg_core_1.text)("description"),
    parentId: (0, pg_core_1.integer)("parent_id"),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").notNull()
});
exports.insertWikiEntrySchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    content: zod_1.z.string().min(1),
    creatorId: zod_1.z.number(),
    category: zod_1.z.string().optional(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    lastEditorId: zod_1.z.number()
});
