import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core'
import { departments } from './departments'

export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  departmentId: integer('department_id')
    .references(() => departments.id, { onDelete: 'set null' }),
})

export type Job = typeof jobs.$inferSelect
export type InsertJob = typeof jobs.$inferInsert
