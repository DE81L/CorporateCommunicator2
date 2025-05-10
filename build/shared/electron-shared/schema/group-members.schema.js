"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertGroupMemberSchema = void 0;
const zod_1 = require("zod");
exports.insertGroupMemberSchema = zod_1.z.object({
    groupId: zod_1.z.number(),
    userId: zod_1.z.number(),
    role: zod_1.z.enum(['admin', 'member'])
});
