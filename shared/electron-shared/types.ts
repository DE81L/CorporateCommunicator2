export interface UserWithoutPassword {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone?: string;
  jobId?: number | null;
  jobTitle?: string | null;
  isonline?: number | boolean;
  isAdmin?: number;   // 0 | 1 (да/нет)
}