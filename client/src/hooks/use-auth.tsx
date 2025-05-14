// client/src/hooks/use-auth.tsx
import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from '@/hooks/use-translations';
import { createApiClient } from "@/lib/api-client";

const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});
export type LoginCredentials = z.infer<typeof loginSchema>;

export interface UserWithoutPassword {
  id: number;
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  isAdmin?: number;
  isOnline: boolean | number;
  avatarUrl: string | null;
}

export interface AuthContextType {
  user: UserWithoutPassword | null;
  login: (credentials: LoginCredentials) => Promise<UserWithoutPassword>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isLoggingIn: boolean;
  isLoggingOut: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { t } = useTranslations();
  const { toast } = useToast();
  const apiClient = createApiClient();

  // 1) Загружаем текущего пользователя при старте
  const { data: user, isLoading: isLoadingUser } = useQuery<UserWithoutPassword | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        return await apiClient.request("/api/user");
      } catch (error) {
        if (error instanceof Error && error.message.includes("401")) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // 2) Login—мутация: теперь отправляем правильное поле и сохраняем куку
  const loginMutation = useMutation<UserWithoutPassword, Error, LoginCredentials>({
    mutationFn: async (credentials) => {
      // Собираем именно то, что ждёт сервер: { usernameOrEmail, password }
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include', // сохраняем Set-Cookie от сервера
        body: JSON.stringify({
          usernameOrEmail: credentials.username,
          password: credentials.password
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        // сервер отдаёт { error: 'Invalid credentials' }
        throw new Error(err.error || 'Login failed');
      }
      return response.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t('auth.loginFailed'),
        description: error.message,
      });
    },
  });

  // 3) Logout—мутация (оставляем как было)
  const logoutMutation = useMutation({
    mutationFn: () => apiClient.request("/api/logout", { method: "POST" }),
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => {
      console.error("Logout failed:", error);
      queryClient.setQueryData(["/api/user"], null);
      queryClient.invalidateQueries();
    },
  });

  const login = useCallback(
    (credentials: LoginCredentials) =>
      loginMutation.mutateAsync(loginSchema.parse(credentials)),
    [loginMutation]
  );

  const logout = useCallback(() => logoutMutation.mutateAsync(), [logoutMutation]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        login,
        logout,
        isLoading: isLoadingUser,
        isLoggingIn: loginMutation.isPending,
        isLoggingOut: logoutMutation.isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
