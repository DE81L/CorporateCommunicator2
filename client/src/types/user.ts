export interface UserWithoutPassword {
  id: number;
  username: string;
  email: string;
  isAdmin?: number;
  phone?: string;
  firstName: string | null;
  lastName: string | null;
  jobTitle?: string | null;
  isOnline: boolean | number;
  avatarUrl: string | null;
}
