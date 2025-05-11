import { z } from 'zod';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Group {
  id: string;
  name: string;
  members: User[];
}

export const insertRequestSchema = z.object({
  userId: z.string().uuid(),
  payload: z.any(),
});
