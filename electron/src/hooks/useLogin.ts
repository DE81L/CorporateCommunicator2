import { useMutation } from '@tanstack/react-query';
// импортируем типы напрямую из общей папки
import { UserWithoutPassword } from '../../../shared/types/user';
import { LoginCredentials } from '../../../shared/src/schema';

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
      // ...существующий код...
    },
    onError: (error) => {
      // ...существующий код...
    }
  });
}