"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertHelpers = exports.insertRequestSchema = exports.requests = exports.tasksCatalog = exports.subdivisions = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const zod_1 = require("zod");
const users_1 = require("./users"); // <-- Import departments
exports.subdivisions = (0, pg_core_1.pgTable)("subdivisions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull()
});
exports.tasksCatalog = (0, pg_core_1.pgTable)("tasks_catalog", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    category: (0, pg_core_1.text)("category").notNull()
});
exports.requests = (0, pg_core_1.pgTable)("requests", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    senderId: (0, pg_core_1.integer)("sender_id").references(() => users_1.users.id).notNull(),
    receiverDepartmentId: (0, pg_core_1.integer)("receiver_department_id") // <-- Changed name
        .references(() => users_1.departments.id)
        .notNull(),
    cabinet: (0, pg_core_1.text)("cabinet"),
    phone: (0, pg_core_1.text)("phone"),
    isUrgent: (0, pg_core_1.boolean)("is_urgent").default(false),
    deadline: (0, pg_core_1.timestamp)("deadline"),
    comment: (0, pg_core_1.text)("comment"),
    whoAccepted: (0, pg_core_1.integer)("who_accepted").references(() => users_1.users.id),
    takenAt: (0, pg_core_1.timestamp)("taken_at"),
    grade: (0, pg_core_1.integer)("grade"),
    reviewText: (0, pg_core_1.text)("review_text"),
    finishedAt: (0, pg_core_1.timestamp)("finished_at"),
    status: (0, pg_core_1.text)("status").default("новая").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull()
});
exports.insertRequestSchema = zod_1.z.object({
    receiverDepartmentId: zod_1.z.number(), // <-- Changed name
    taskId: zod_1.z.number(),
    cabinet: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    isUrgent: zod_1.z.boolean().default(false),
    deadline: zod_1.z.string().optional(),
    comment: zod_1.z.string().optional(),
    status: zod_1.z.string().default("новая"),
    grade: zod_1.z.number().optional(),
    reviewText: zod_1.z.string().optional()
});
exports.convertHelpers = {
    toDbBoolean: (v) => (v ? 1 : 0),
    fromDbBoolean: (n) => n === 1,
    toDbDate: (d) => d.toISOString(),
    fromDbDate: (s) => new Date(s),
    compareDates: (a, b) => new Date(a).getTime() - new Date(b).getTime(),
};
