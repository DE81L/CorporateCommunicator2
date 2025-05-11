import { z } from 'zod';
export const insertRequestSchema = z.object({
    userId: z.string().uuid(),
    payload: z.any(),
});
