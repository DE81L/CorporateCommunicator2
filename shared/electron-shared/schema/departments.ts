import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  parentId: integer('parent_id'),
});

export const departmentRelations = relations(departments, ({ one }) => ({
  parent: one(departments, {
    fields: [departments.parentId],
    references: [departments.id],
  }),
}));

export type Department = typeof departments.$inferSelect;
