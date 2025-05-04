export interface UserWithoutPassword {
  id: number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isAdmin?: number;
}

export interface User extends UserWithoutPassword {
  password: string;
}
