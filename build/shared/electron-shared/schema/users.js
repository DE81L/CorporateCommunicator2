"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.departments = exports.insertUserSchema = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const zod_1 = require("zod");
const departments_1 = require("./departments");
Object.defineProperty(exports, "departments", { enumerable: true, get: function () { return departments_1.departments; } });
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    username: (0, pg_core_1.text)("username").notNull(),
    email: (0, pg_core_1.text)("email").notNull(),
    password: (0, pg_core_1.text)("password").notNull(),
    firstName: (0, pg_core_1.text)("first_name").notNull(), // Updated column name
    lastName: (0, pg_core_1.text)("last_name").notNull(), // Updated column name
    isOnline: (0, pg_core_1.integer)("isonline").default(0),
    avatarUrl: (0, pg_core_1.text)("avatarurl"),
    departmentId: (0, pg_core_1.integer)('department_id').references(() => departments_1.departments.id),
    jobTitle: (0, pg_core_1.text)('job_title'),
    language: (0, pg_core_1.text)('language').default('en'),
    isAdmin: (0, pg_core_1.boolean)('is_admin').default(false).notNull(),
});
exports.insertUserSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, "Username is required"),
    email: zod_1.z.string().email("Invalid email"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
    firstName: zod_1.z.string().min(1, "First name is required"),
    lastName: zod_1.z.string().min(1, "Last name is required"),
});
