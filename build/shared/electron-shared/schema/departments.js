"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.departmentRelations = exports.departments = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.departments = (0, pg_core_1.pgTable)('departments', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    parentId: (0, pg_core_1.integer)('parent_id'),
});
exports.departmentRelations = (0, drizzle_orm_1.relations)(exports.departments, ({ one }) => ({
    parent: one(exports.departments, {
        fields: [exports.departments.parentId],
        references: [exports.departments.id],
    }),
}));
