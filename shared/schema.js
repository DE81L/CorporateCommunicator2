import { pgTable, serial, text, integer, date, timestamp, foreignKey } from "drizzle-orm/pg-core";
import { z } from "zod";

// Define special null-like values
export const NULL_DATE = new Date("1900-01-01").toISOString();
export const NULL_TEXT = "__NULL_VALUE_7f9c2b3a4e";
export const NULL_NUMBER = -999999;
// Define base schemas for insert operations
export const insertMessageSchema = z.object({
    senderId: z.number(),
    receiverId: z.number().optional(),
    groupId: z.number().optional(),
    content: z.string(),
    timestamp: z.string(), // Change from date to string
    isRead: z.number().optional(), // Change from boolean to number
});
export const insertGroupSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    creatorId: z.number(),
    isAnnouncement: z.number().optional(), // Change from boolean to number
});
export const insertGroupMemberSchema = z.object({
    groupId: z.number(),
    userId: z.number(),
    isAdmin: z.number().optional(), // Change from boolean to number
});
export const insertRequestSchema = z.object({
    numberOfRequest: z.string(),
    dateOfRequest: z.string(), // Change from date to string
    deadline: z.string().optional(), // Change from date to string
    category: z.string().optional(),
    cabinet: z.string(),
    localNumber: z.string(),
    comment: z.string(),
    whoAccepted: z.string(),
    requestStatus: z.string(),
    subdivision: z.string().optional(),
    grade: z.number().optional(),
    reviewText: z.string().optional(),
    creatorId: z.number(),
    createdAt: z.string(), // Add required fields
    updatedAt: z.string(),
});
// Export the validation schema
export const insertUserSchema = z.object({
    username: z.string().min(1, "Username is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
});
// Table definitions
export const groups = pgTable("groups", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description").default(NULL_TEXT),
    creatorId: integer("creator_id").notNull(),
    isAnnouncement: integer("is_announcement").default(0),
});
export const groupMembers = pgTable("group_members", {
    id: serial("id").primaryKey(),
    groupId: integer("group_id").notNull(),
    userId: integer("user_id").notNull(),
    isAdmin: integer("is_admin").default(0),
});
// Make sure these are exported
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull(),
    email: text("email").notNull(),
    password: text("password").notNull(),
    firstName: text("firstname").notNull(),
    lastName: text("lastname").notNull(),
    isOnline: integer("isonline").default(0),
    avatarUrl: text("avatarurl").default(NULL_TEXT),
});
// Таблица заявок с требуемыми полями
export const requests = pgTable("requests", {
    id: serial("id").primaryKey(),
    senderId: integer("sender_id")
        .notNull()
        .references(() => users.id, {
            onDelete: "cascade",
            onUpdate: "cascade",
        }),
    receiverSubdivisionId: integer("receiver_subdivision_id")
        .notNull()
        .references(() => subdivisions.id, {
            onDelete: "cascade",
            onUpdate: "cascade",
        }),
    cabinet: text("cabinet").notNull(),
    phone: text("phone").notNull(),
    taskId: integer("task_id")
        .notNull()
        .references(() => tasksCatalog.id, {
            onDelete: "cascade",
            onUpdate: "cascade",
        }),
    customTitle: text("custom_title"),
    comment: text("comment"),
    status: text("status").notNull(),
    createdAt: timestamp("created_at").notNull(),
    finishedAt: timestamp("finished_at"),
}, (table) => {
  return {
    senderIdIdx: foreignKey({
      columns: [table.senderId],
      foreignColumns: [users.id]
    })
  }
});
// Для удобных проверок данных при вставке/обновлении
export const messages = pgTable("messages", {
    id: serial("id").primaryKey(),
    senderId: integer("sender_id").notNull(),
    receiverId: integer("receiver_id").default(NULL_NUMBER),
    groupId: integer("group_id").default(NULL_NUMBER),
    content: text("content").notNull(),
    timestamp: date("timestamp").notNull(),
    isRead: integer("is_read").default(0),
});
// Add these helper functions
export const convertHelpers = {
    toDbBoolean: (value) => (value ? 1 : 0),
    fromDbBoolean: (value) => value === 1,
    toDbDate: (date) => date.toISOString(),
    fromDbDate: (dateStr) => new Date(dateStr),
    compareDates: (a, b) => new Date(a).getTime() - new Date(b).getTime(),
};
// Update isNullValue helper
export const isNullValue = {
    date: (value) => value === NULL_DATE,
    text: (value) => value === NULL_TEXT,
    number: (value) => value === NULL_NUMBER,
};
// Wiki entries schema and tables
export const wikiEntries = pgTable("wiki_entries", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    creatorId: integer("creator_id").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    lastEditorId: integer("last_editor_id").notNull(),
    category: text("category").default(NULL_TEXT),
});
export const wikiCategories = pgTable("wiki_categories", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description").default(NULL_TEXT),
    parentId: integer("parent_id").default(NULL_NUMBER),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});
// Wiki schema for inserting entries
export const insertWikiEntrySchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    creatorId: z.number(),
    category: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    lastEditorId: z.number(),
});
// Wiki schema for inserting categories
export const insertWikiCategorySchema = z.object({
    name: z.string().min(1, "Category name is required"),
    description: z.string().optional(),
    parentId: z.number().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const subdivisions = pgTable("subdivisions", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
});

export const tasksCatalog = pgTable("tasks_catalog", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
});

