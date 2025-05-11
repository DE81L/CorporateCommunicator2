import { z } from "zod";
export interface User {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    avatarUrl?: string | null;
}
export interface Group {
    id: number;
    name: string;
    description?: string;
    isAnnouncement?: boolean;
    members: User[];
}
export declare const insertRequestSchema: z.ZodObject<{
    userId: z.ZodNumber;
    payload: z.ZodAny;
}, "strip", z.ZodTypeAny, {
    userId: number;
    payload?: any;
}, {
    userId: number;
    payload?: any;
}>;
//# sourceMappingURL=schema.d.ts.map