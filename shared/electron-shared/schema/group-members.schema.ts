import { z } from 'zod';
import { groupMembers } from './groups';

export const insertGroupMemberSchema = z.object({
  groupId: z.number(),
  userId: z.number(),
  role: z.enum(['admin', 'member'])
});

export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
