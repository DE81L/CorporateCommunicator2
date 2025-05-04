import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";
import { users } from "./users";

export const subdivisions = pgTable("subdivisions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull()
});

export const tasksCatalog = pgTable("tasks_catalog", {
  id: serial("id").primaryKey(),
  title: text("title").notNull()
});

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverSubdivisionId: integer("receiver_subdivision_id")
    .references(() => subdivisions.id)
    .notNull(),
  cabinet: text("cabinet").notNull(),
  phone: text("phone").notNull(),
  taskId: integer("task_id").references(() => tasksCatalog.id).notNull(),
  customTitle: text("custom_title"),
  comment: text("comment"),
  status: text("status").default("новая").notNull(),
  createdAt: timestamp("created_at").notNull(),
  finishedAt: timestamp("finished_at")
});

export const insertRequestSchema = z.object({
  receiverSubdivisionId: z.number(),
  taskId: z.number(),
  phone: z.string(),
  cabinet: z.string(),
  customTitle: z.string().optional(),
  comment: z.string().optional(),
  numberOfRequest: z.string().optional(),
  requestStatus: z.string().optional(),
  grade: z.number().optional(),
  reviewText: z.string().optional(),
  creatorId: z.number(),
  createdAt: z.string(),
  updatedAt: z.string()
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
