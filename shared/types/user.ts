export interface UserWithoutPassword {
  id: number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  jobId?: number | null;
  jobTitle?: string | null;
  isonline?: number | boolean;
  isAdmin?: number;
}

export interface User extends UserWithoutPassword {
  password: string;
}
