import { useMutation } from '@tanstack/react-query';
import { UserWithoutPassword } from '@shared/types/user';
import { LoginCredentials } from '@shared/schema';

export function useLogin() {
  const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  return useMutation<UserWithoutPassword, Error, LoginCredentials>({
    mutationFn: async (credentials): Promise<UserWithoutPassword> => {
      const response = await fetch(`${baseURL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        throw new Error("Login failed");
      }
      const user: UserWithoutPassword = await response.json();
      return user;
    },
    onSuccess: (user) => {
      // ...existing code...
    },
    onError: (error) => {
      // ...existing code...
    }
  });
}