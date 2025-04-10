import { createContext, ReactNode, useContext, useMemo, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useLocation } from "wouter";
import { getQueryFn, createApiClient, queryClient } from "../lib/queryClient";
import { useTranslations } from "./use-translations";


export type User = {
  id: number;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  isOnline: boolean;
  avatarUrl?: string | null;
};
export type LoginCredentials = z.infer<ReturnType<typeof createLoginSchema>>;
export type UserWithoutPassword = Omit<User, 'password'> & {
  isOnline: number | boolean;
  isAdmin?: number;
};

export interface AuthContextType {
  user: UserWithoutPassword | null;
  isLoading?: boolean;
  error: Error | null | undefined;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: z.infer<ReturnType<typeof registerSchema>>) => Promise<UserWithoutPassword>;
  sendIPC: null;
  }

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const createLoginSchema = (t: (key: string) => string) =>
  z.object({
    username: z.string()
      .min(1, t("auth.usernameRequired")),
    password: z
      .string()
      .min(1, t("auth.passwordRequired")),
  });

export const registerSchema = (t: (key: string) => string) => {
  const {
    shape: { username, password },
  } = createLoginSchema(t);
  const passwordsDontMatch = t('auth.passwordsDontMatch');
  return z.object({ username, password, confirmPassword: z.string() }) 
    .refine(data => data.password === data.confirmPassword, { 
      message: passwordsDontMatch,
      path: ["confirmPassword"],
    });
  };


export function AuthProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslations();

  const regSchema = useMemo(
    () => registerSchema((key: string) => t(key as any)),
    [t],
  );
  const [, setLocation] = useLocation();

  const { data: user, isLoading, error: authError } = useQuery<
    UserWithoutPassword | null,
    Error
  >({
    queryKey: ["/api/user"],
    queryFn: getQueryFn("/api/user"),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<UserWithoutPassword> => {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
         body: JSON.stringify(credentials),
      });
      const user = await res.json();
      return user;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/logout", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      
      setLocation("/auth");
    },
  });
  const registerMutation = useMutation({
    mutationFn: async (userData: z.infer<typeof regSchema>): Promise<UserWithoutPassword>  => {
      const { confirmPassword, ...data } = userData;
      const apiClient = createApiClient(false); // Assuming isElectron is always false here
      const res = await apiClient.request("/api/register", { method: "POST", body: JSON.stringify(data) });
      const user = await res.json();
      return user;
    },
  });

  const login = useCallback(async (credentials) => await loginMutation.mutateAsync(credentials), [loginMutation])
 return (
    <AuthContext.Provider
    value={{
      apiRequest: null,
      user: user || null,
      isLoading,
      error: authError,
      sendIPC: null,
      login: async (credentials) => await loginMutation.mutateAsync(credentials) as any,
      logout: () => logoutMutation.mutateAsync(),
      register: (data) => registerMutation.mutateAsync(data),
    }}
    >
      {children}
    </AuthContext.Provider>
  );
}
