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
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  isAnnouncement?: boolean;
  members: User[];
}

export const insertRequestSchema = z.object({
  userId: z.number(),
  payload: z.any(),
});
