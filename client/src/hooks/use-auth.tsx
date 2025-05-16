// client/src/hooks/use-auth.tsx
import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  MutationFunction,
} from "@tanstack/react-query";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/hooks/use-translations";
import { createApiClient } from "@/lib/api-client";

/* ────────────────────────────────────────────────────────── */
/* Types & Schemas                                           */
/* ────────────────────────────────────────────────────────── */

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

/* ────────────────────────────────────────────────────────── */
/* Context                                                   */
/* ────────────────────────────────────────────────────────── */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ────────────────────────────────────────────────────────── */
/* Provider                                                  */
/* ────────────────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { t } = useTranslations();
  const { toast } = useToast();
  const apiClient = createApiClient();

  /* ─── CURRENT USER ────────────────────────────────────── */
  const {
    data: user,
    isLoading: isLoadingUser,
  } = useQuery<UserWithoutPassword | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        // 1️⃣ undefined → null
        return (await apiClient.request<UserWithoutPassword>(
          "/api/user",
        )) ?? null;
      } catch (error) {
        // 401 → не залогинен → возвращаем null
        if (error instanceof Error && error.message.includes("401")) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

  /* ─── LOGIN ───────────────────────────────────────────── */
  const loginMutation = useMutation<
    UserWithoutPassword,
    Error,
    LoginCredentials
  >({
    mutationFn: async (credentials) => {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          usernameOrEmail: credentials.username,
          password: credentials.password,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Login failed");
      }
      return (await res.json()) as UserWithoutPassword;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: t("auth.loginFailed"),
        description: error.message,
      });
    },
  });

  /* ─── LOGOUT ──────────────────────────────────────────── */
  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiClient.request("/api/logout", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      console.error("Logout failed:", error);
      queryClient.setQueryData(["/api/user"], null);
      queryClient.invalidateQueries();
    },
  });

  /* ─── PUBLIC API ──────────────────────────────────────── */
  const login = useCallback(
    (c: LoginCredentials) =>
      loginMutation.mutateAsync(loginSchema.parse(c)),
    [loginMutation],
  );

  // 2️⃣ возвращаем Promise<void>, результат logoutMutation игнорируем
  const logout = useCallback(async (): Promise<void> => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  /* ─── RENDER ──────────────────────────────────────────── */
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

/* ────────────────────────────────────────────────────────── */
/* Hook                                                     */
/* ────────────────────────────────────────────────────────── */

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
