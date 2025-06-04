import { z } from "zod";

/* ============================================================
   Core entities kept in sync across client, server and shared
   NOTE: IDs are numbers everywhere – easier in React code.
   ============================================================ */

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  jobId?: number | null;
  jobTitle?: string | null;
  isonline?: number | boolean;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  isAnnouncement?: boolean;
  creatorId?: number;
  isExplanation?: boolean;
  members: User[];
}

export const insertRequestSchema = z.object({
  receiverDepartmentId: z.number(),
  taskId: z.number(),
  cabinet: z.string().optional(),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^(\+?[0-9]{10,15}|[0-9]{6})$/.test(val), {
      message: 'Invalid phone number',
    }),
  isUrgent: z.boolean().default(false),
  deadline: z.string().optional(),
  comment: z.string().optional(),
  status: z.string().default("новая"),
  grade: z.number().optional(),
  reviewText: z.string().optional()
});

export type InsertRequestInput = z.infer<typeof insertRequestSchema>;

export const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;
export * from './schema/wiki';