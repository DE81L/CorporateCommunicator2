export interface UserWithoutPassword {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone?: string;
  jobTitle?: string | null;
  isonline?: number | boolean;
  isAdmin?: number;   // 0 | 1
}