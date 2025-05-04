import { pgTable, serial, integer, text } from "drizzle-orm/pg-core";
import { users } from "./users";

/** chat rooms + announcement channels */
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  creatorId: integer("creator_id").references(() => users.id),
  isAnnouncement: integer("is_announcement").default(0)
});

export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => groups.id),
  userId: integer("user_id").references(() => users.id),
  isAdmin: integer("is_admin").default(0)
});

export type Group = typeof groups.$inferSelect;
export type InsertGroup = typeof groups.$inferInsert;
export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = typeof groupMembers.$inferInsert;
