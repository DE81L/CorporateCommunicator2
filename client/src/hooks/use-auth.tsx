import { createContext, ReactNode, useContext, useMemo, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useLocation } from "wouter";
import { getQueryFn, createApiClient, queryClient } from "../lib/queryClient";
import { useToast } from "./use-toast";
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
  login: (credentials: LoginCredentials) => Promise<UserWithoutPassword>;
  logout: () => Promise<void>;
  register: (data: z.infer<ReturnType<typeof registerSchema>>) => Promise<void>;
  
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
  const { toast } = useToast();

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
      console.log("Attempting hardcoded login with:", credentials);

            // Hardcoded user data
     
      const user2: UserWithoutPassword = {
        id: 4, // Assuming ID for user2
        username: "user2",
        email: "user2@example.com",
        firstName: "user2",
        lastName: "user2",
        isOnline: true,
        avatarUrl: null
      }; const user1: UserWithoutPassword = {
        id: 3,
        username: "user1",
        email: "user1@example.com",
        firstName: "user1",
        lastName: "user1",
        isOnline: true,
        avatarUrl: null
      };

        // Check which user to log in as (simple check based on username/email)
        if (credentials.username === "user1" || credentials.username === "user1@example.com") {
          console.log("Hardcoding login for user1");
          // Simulate network delay for realism (optional)
          await new Promise(resolve => setTimeout(resolve, 300));
          return user1;
        }
  
        if (credentials.username === "user2" || credentials.username === "user2@example.com") {
          console.log("Hardcoding login for user2");
          // Simulate network delay for realism (optional)
          await new Promise(resolve => setTimeout(resolve, 300));
          return user2;
        }
  
      // Simulate network delay for realism (optional)
      await new Promise(resolve => setTimeout(resolve, 300));
      return user1;
    },
        onSuccess: (loggedInUser) => {
      queryClient.setQueryData(["/api/user"], loggedInUser);
      toast({
          setLocation("/");
        title: "Hardcoded Login Successful",
        description: `Logged in as ${loggedInUser.firstName}`,
      });
    },
      onError: (error: Error) => {
      toast({
        title: "Hardcoded Login Failed",
        description: error.message,
        variant: "destructive",
      });
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
    mutationFn: async (userData: z.infer<typeof regSchema>) => {
      const { confirmPassword, ...data } = userData;      
      const apiClient = createApiClient(false);
      const res = await apiClient.request("POST", "/api/register", JSON.stringify(data));
      if (res.ok) {
        return res.json();
      }
        const errorText = await res.text();
        throw new Error(errorText || 'register failed');
    },
  });

  const login = useCallback(async (credentials: LoginCredentials) => {
    return await loginMutation.mutateAsync(credentials)
  }, [loginMutation]);

  return (
    <AuthContext.Provider
    value={{
      user: user || null,
      isLoading,
      error: authError,
      login,
      logout: () => logoutMutation.mutateAsync(),
      register: (data) => registerMutation.mutateAsync(data),
    }}
    >
      {children}
    </AuthContext.Provider>
  );
}
