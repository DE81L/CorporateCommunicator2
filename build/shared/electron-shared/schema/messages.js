"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messages = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
/** chat / DM messages */
exports.messages = (0, pg_core_1.pgTable)("messages", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    senderId: (0, pg_core_1.integer)("sender_id").notNull().references(() => users_1.users.id),
    receiverId: (0, pg_core_1.integer)("receiver_id"),
    groupId: (0, pg_core_1.integer)("group_id"),
    content: (0, pg_core_1.text)("content").notNull(),
    timestamp: (0, pg_core_1.date)("timestamp").notNull(),
    isRead: (0, pg_core_1.integer)("is_read").default(0),
    status: (0, pg_core_1.text)("status").default("pending").notNull()
});
