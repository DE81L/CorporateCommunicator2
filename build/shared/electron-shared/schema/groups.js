"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupMembers = exports.groups = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
/** chat rooms + announcement channels */
exports.groups = (0, pg_core_1.pgTable)("groups", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    description: (0, pg_core_1.text)("description"),
    creatorId: (0, pg_core_1.integer)("creator_id").references(() => users_1.users.id),
    isAnnouncement: (0, pg_core_1.integer)("is_announcement").default(0)
});
exports.groupMembers = (0, pg_core_1.pgTable)("group_members", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    groupId: (0, pg_core_1.integer)("group_id").references(() => exports.groups.id),
    userId: (0, pg_core_1.integer)("user_id").references(() => users_1.users.id),
    isAdmin: (0, pg_core_1.integer)("is_admin").default(0)
});
