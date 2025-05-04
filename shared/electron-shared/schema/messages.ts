import { pgTable, serial, integer, text, date } from "drizzle-orm/pg-core";
import { users } from "./users";

/** chat / DM messages */
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id"),
  groupId: integer("group_id"),
  content: text("content").notNull(),
  timestamp: date("timestamp").notNull(),
  isRead: integer("is_read").default(0),
  status: text("status").default("pending").notNull()
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
