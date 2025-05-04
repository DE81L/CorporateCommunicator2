import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { z } from "zod";
import { departments } from './departments';

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  firstName: text("firstname").notNull(),
  lastName: text("lastname").notNull(),
  isOnline: integer("isonline").default(0),
  avatarUrl: text("avatarurl"),
  departmentId: integer('department_id').references(() => departments.id),
  jobTitle: text('job_title'),
  language: text('language').default('en'),
  isAdmin: boolean('is_admin').default(false).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const insertUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});
