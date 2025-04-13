"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertWikiCategorySchema = exports.insertWikiEntrySchema = exports.wikiCategories = exports.wikiEntries = exports.isNullValue = exports.convertHelpers = exports.messages = exports.requests = exports.users = exports.groupMembers = exports.groups = exports.insertUserSchema = exports.insertRequestSchema = exports.insertGroupMemberSchema = exports.insertGroupSchema = exports.insertMessageSchema = exports.NULL_NUMBER = exports.NULL_TEXT = exports.NULL_DATE = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const zod_1 = require("zod");
// Define special null-like values
exports.NULL_DATE = new Date("1900-01-01").toISOString();
exports.NULL_TEXT = "__NULL_VALUE_7f9c2b3a4e";
exports.NULL_NUMBER = -999999;
// Define base schemas for insert operations
exports.insertMessageSchema = zod_1.z.object({
    senderId: zod_1.z.number(),
    receiverId: zod_1.z.number().optional(),
    groupId: zod_1.z.number().optional(),
    content: zod_1.z.string(),
    timestamp: zod_1.z.string(), // Change from date to string
    isRead: zod_1.z.number().optional(), // Change from boolean to number
});
exports.insertGroupSchema = zod_1.z.object({
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    creatorId: zod_1.z.number(),
    isAnnouncement: zod_1.z.number().optional(), // Change from boolean to number
});
exports.insertGroupMemberSchema = zod_1.z.object({
    groupId: zod_1.z.number(),
    userId: zod_1.z.number(),
    isAdmin: zod_1.z.number().optional(), // Change from boolean to number
});
exports.insertRequestSchema = zod_1.z.object({
    numberOfRequest: zod_1.z.string(),
    dateOfRequest: zod_1.z.string(), // Change from date to string
    deadline: zod_1.z.string().optional(), // Change from date to string
    category: zod_1.z.string().optional(),
    cabinet: zod_1.z.string(),
    localNumber: zod_1.z.string(),
    comment: zod_1.z.string(),
    whoAccepted: zod_1.z.string(),
    requestStatus: zod_1.z.string(),
    subdivision: zod_1.z.string().optional(),
    grade: zod_1.z.number().optional(),
    reviewText: zod_1.z.string().optional(),
    creatorId: zod_1.z.number(),
    createdAt: zod_1.z.string(), // Add required fields
    updatedAt: zod_1.z.string(),
});
// Export the validation schema
exports.insertUserSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, "Username is required"),
    email: zod_1.z.string().email("Invalid email"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
    firstName: zod_1.z.string().min(1, "First name is required"),
    lastName: zod_1.z.string().min(1, "Last name is required"),
});
// Table definitions
exports.groups = (0, pg_core_1.pgTable)("groups", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    description: (0, pg_core_1.text)("description").default(exports.NULL_TEXT),
    creatorId: (0, pg_core_1.integer)("creator_id").notNull(),
    isAnnouncement: (0, pg_core_1.integer)("is_announcement").default(0),
});
exports.groupMembers = (0, pg_core_1.pgTable)("group_members", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    groupId: (0, pg_core_1.integer)("group_id").notNull(),
    userId: (0, pg_core_1.integer)("user_id").notNull(),
    isAdmin: (0, pg_core_1.integer)("is_admin").default(0),
});
// Make sure these are exported
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    username: (0, pg_core_1.text)("username").notNull(),
    email: (0, pg_core_1.text)("email").notNull(),
    password: (0, pg_core_1.text)("password").notNull(),
    firstName: (0, pg_core_1.text)("firstname").notNull(),
    lastName: (0, pg_core_1.text)("lastname").notNull(),
    isOnline: (0, pg_core_1.integer)("isonline").default(0),
    avatarUrl: (0, pg_core_1.text)("avatarurl").default(exports.NULL_TEXT),
});
// Таблица заявок с требуемыми полями
exports.requests = (0, pg_core_1.pgTable)("requests", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    // Номер заявки
    numberOfRequest: (0, pg_core_1.text)("number_of_request").notNull(),
    // Дата заявки
    dateOfRequest: (0, pg_core_1.date)("date_of_request").notNull(),
    // Using default values instead of nullable
    deadline: (0, pg_core_1.date)("deadline").default(exports.NULL_DATE),
    // Категория (null при отсутствии)
    category: (0, pg_core_1.text)("category").default(exports.NULL_TEXT),
    // Кабинет
    cabinet: (0, pg_core_1.text)("cabinet").notNull(),
    // Локальный номер
    localNumber: (0, pg_core_1.text)("local_number").notNull(),
    // Комментарий
    comment: (0, pg_core_1.text)("comment").notNull(),
    // Кто принял заявку
    whoAccepted: (0, pg_core_1.text)("who_accepted").notNull(),
    // Состояние заявки (например, "новая", "выполнена", "в процессе", и т.д.)
    requestStatus: (0, pg_core_1.text)("request_status").notNull(),
    // Подразделение (null при отсутствии)
    subdivision: (0, pg_core_1.text)("subdivision").default(exports.NULL_TEXT),
    // Оценка (от 1 до 5; null, если заявка не завершена или не оценена)
    grade: (0, pg_core_1.integer)("grade").default(exports.NULL_NUMBER),
    // Текстовый отзыв (заполняется только если grade < 5)
    reviewText: (0, pg_core_1.text)("review_text").default(exports.NULL_TEXT),
    createdAt: (0, pg_core_1.date)("created_at").notNull(),
    updatedAt: (0, pg_core_1.date)("updated_at").notNull(),
    assigneeId: (0, pg_core_1.integer)("assignee_id").default(exports.NULL_NUMBER),
    creatorId: (0, pg_core_1.integer)("creator_id").notNull(),
});
// Для удобных проверок данных при вставке/обновлении
exports.messages = (0, pg_core_1.pgTable)("messages", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    senderId: (0, pg_core_1.integer)("sender_id").notNull(),
    receiverId: (0, pg_core_1.integer)("receiver_id").default(exports.NULL_NUMBER),
    groupId: (0, pg_core_1.integer)("group_id").default(exports.NULL_NUMBER),
    content: (0, pg_core_1.text)("content").notNull(),
    timestamp: (0, pg_core_1.date)("timestamp").notNull(),
    isRead: (0, pg_core_1.integer)("is_read").default(0),
});
// Add these helper functions
exports.convertHelpers = {
    toDbBoolean: (value) => (value ? 1 : 0),
    fromDbBoolean: (value) => value === 1,
    toDbDate: (date) => date.toISOString(),
    fromDbDate: (dateStr) => new Date(dateStr),
    compareDates: (a, b) => new Date(a).getTime() - new Date(b).getTime(),
};
// Update isNullValue helper
exports.isNullValue = {
    date: (value) => value === exports.NULL_DATE,
    text: (value) => value === exports.NULL_TEXT,
    number: (value) => value === exports.NULL_NUMBER,
};
// Wiki entries schema and tables
exports.wikiEntries = (0, pg_core_1.pgTable)("wiki_entries", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    title: (0, pg_core_1.text)("title").notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    creatorId: (0, pg_core_1.integer)("creator_id").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").notNull(),
    lastEditorId: (0, pg_core_1.integer)("last_editor_id").notNull(),
    category: (0, pg_core_1.text)("category").default(exports.NULL_TEXT),
});
exports.wikiCategories = (0, pg_core_1.pgTable)("wiki_categories", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    description: (0, pg_core_1.text)("description").default(exports.NULL_TEXT),
    parentId: (0, pg_core_1.integer)("parent_id").default(exports.NULL_NUMBER),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").notNull(),
});
// Wiki schema for inserting entries
exports.insertWikiEntrySchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Title is required"),
    content: zod_1.z.string().min(1, "Content is required"),
    creatorId: zod_1.z.number(),
    category: zod_1.z.string().optional(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    lastEditorId: zod_1.z.number(),
});
// Wiki schema for inserting categories
exports.insertWikiCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Category name is required"),
    description: zod_1.z.string().optional(),
    parentId: zod_1.z.number().optional(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
