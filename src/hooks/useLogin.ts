import { useMutation } from '@tanstack/react-query';

export function useLogin() {
  return useMutation<UserWithoutPassword, Error, LoginCredentials>({
    mutationFn: async (credentials) => {
      // ...existing code...
    },
    onSuccess: (user) => {
      // ...existing code...
    },
    onError: (error) => {
      // ...existing code...
    }
  });
}