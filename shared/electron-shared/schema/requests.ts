import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { z } from "zod";
import { users, departments } from "./users"; // <-- Import departments

export const subdivisions = pgTable("subdivisions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull()
});

export const tasksCatalog = pgTable("tasks_catalog", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull()
});

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverDepartmentId: integer("receiver_department_id") // <-- Changed name
    .references(() => departments.id)
    .notNull(),
  cabinet: text("cabinet"),
  phone: text("phone"),
  isUrgent: boolean("is_urgent").default(false),
  deadline: timestamp("deadline"),
  comment: text("comment"),
  whoAccepted: integer("who_accepted").references(() => users.id),
  takenAt: timestamp("taken_at"),
  grade: integer("grade"),
  reviewText: text("review_text"),
  finishedAt: timestamp("finished_at"),
  status: text("status").default("новая").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertRequestSchema = z.object({
  receiverDepartmentId: z.number(), // <-- Changed name
  taskId: z.number(),
  cabinet: z.string().optional(),
  phone: z.string().optional(),
  isUrgent: z.boolean().default(false),
  deadline: z.string().optional(),
  comment: z.string().optional(),
  status: z.string().default("новая"),
  grade: z.number().optional(),
  reviewText: z.string().optional()
});

export type Request = typeof requests.$inferSelect;
export type InsertRequest = typeof requests.$inferInsert;

export const convertHelpers = {
  toDbBoolean: (v: unknown) => (v ? 1 : 0),
  fromDbBoolean: (n: number) => n === 1,
  toDbDate: (d: Date) => d.toISOString(), 
  fromDbDate: (s: string) => new Date(s),
  compareDates: (a: string | Date, b: string | Date) =>
    new Date(a).getTime() - new Date(b).getTime(),
};
