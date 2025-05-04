export interface UserWithoutPassword {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone?: string;
  isAdmin?: number;   // 0 | 1
}