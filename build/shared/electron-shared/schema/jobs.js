"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobs = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const departments_1 = require("./departments");
exports.jobs = (0, pg_core_1.pgTable)('jobs', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    departmentId: (0, pg_core_1.integer)('department_id')
        .references(() => departments_1.departments.id, { onDelete: 'set null' }),
});
