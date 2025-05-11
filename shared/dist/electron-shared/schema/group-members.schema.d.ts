import { z } from 'zod';
export declare const insertGroupMemberSchema: z.ZodObject<{
    groupId: z.ZodNumber;
    userId: z.ZodNumber;
    role: z.ZodEnum<["admin", "member"]>;
}, "strip", z.ZodTypeAny, {
    userId: number;
    groupId: number;
    role: "admin" | "member";
}, {
    userId: number;
    groupId: number;
    role: "admin" | "member";
}>;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
//# sourceMappingURL=group-members.schema.d.ts.map