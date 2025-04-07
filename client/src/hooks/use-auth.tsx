import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema } from "../../../shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useLocation } from "wouter";
import { useElectron } from "../hooks/use-electron";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export interface User {
  id: number;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  isOnline: boolean;
  avatarUrl?: string | null;
}

export type UserWithoutPassword = Omit<User, "password"> & {
  isOnline: number | boolean;
  isAdmin?: number;
};

const registerSchema = insertUserSchema
  .extend({
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const TEST_ACCOUNTS = [
  { username: "ivanov", password: "password" },
  { username: "petrov", password: "password" },
  { username: "sidorov", password: "password" },
  { username: "johndoe", password: "password" },
] as const;

interface AuthContextType {
  user: UserWithoutPassword | null; // Remove undefined
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<any, Error, z.infer<typeof loginSchema>>;
  registerMutation: UseMutationResult<
    any,
    Error,
    z.infer<typeof registerSchema>
  >;
  logoutMutation: UseMutationResult<void, Error, void>;
  getRandomUser: () => Promise<UserWithoutPassword>; // Fix return type
  getRandomUserAndLogin: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return context;
};

// Add base URL constant
const API_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "http://localhost:3000"; // Change in production

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isElectron, api } = useElectron();

  // Добавляем loading состояние
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<Error | null>(null);

  const {
    data: user,
    error,
    isLoading: isUserLoading,
  } = useQuery<UserWithoutPassword | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: isElectron ? 3 : 1, // Больше попыток для Electron
  });

  // Эффект для автоматического восстановления сессии
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // В Electron пробуем получить сохраненные данные
        if (isElectron && api?.storage) {
          const userData = await api.storage.getUserData();
          if (userData) {
            queryClient.setQueryData(["/api/user"], userData);
          }
        }
      } catch (error) {
        console.error("Failed to restore auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [isElectron, api]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: z.infer<typeof loginSchema>) => {
      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Login failed");
      }

      return res.json();
    },
    onSuccess: (user: UserWithoutPassword) => {
      queryClient.setQueryData(["/api/user"], user);
      setLocation("/"); // Redirect after login
      toast({
        title: "Logged in successfully",
        description: `Welcome back, ${user.firstName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: z.infer<typeof registerSchema>) => {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...userDataWithoutConfirm } = userData;
      const res = await apiRequest(
        "POST",
        "/api/register",
        userDataWithoutConfirm,
      );
      return await res.json();
    },
    onSuccess: (user: UserWithoutPassword) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome to Nexus, ${user.firstName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out successfully",
        description: "You have been logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getRandomUser = async () => {
    try {
      const res = await fetch(`${API_URL}/api/random-user`, {
        credentials: "include",
      });
      const randomUser: UserWithoutPassword = await res.json();
      return randomUser;
    } catch (error: any) {
      toast({
        title: "Failed to fetch random user",
        description: error.message,
        variant: "destructive",
      });
      // Fallback user if API fails
      return {
        id: 1,
        username: "demo",
        firstName: "Demo",
        lastName: "User",
        email: "demo@example.com",
        isOnline: 1 as number,
        isAdmin: 1 as number, // Set as admin for testing
        avatarUrl: null,
      } as UserWithoutPassword;
    }
  };

  const getRandomAccount = () => {
    const randomIndex = Math.floor(Math.random() * TEST_ACCOUNTS.length);
    return TEST_ACCOUNTS[randomIndex];
  };

  const getRandomUserAndLogin = async () => {
    try {
      // First get random user
      const randomUser = await getRandomUser();

      // Then perform login with credentials
      const randomAccount = TEST_ACCOUNTS.find(
        (account) => account.username === randomUser.username,
      );

      if (!randomAccount) {
        throw new Error("No matching test account found");
      }

      await loginMutation.mutateAsync({
        username: randomAccount.username,
        password: randomAccount.password,
      });

      setLocation("/"); // Redirect after successful login
    } catch (error: any) {
      toast({
        title: "Auto-login failed",
        description: error.message,
        variant: "destructive",
      });
      setAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-login effect
  useEffect(() => {
    if (!isLoading && !user) {
      getRandomUserAndLogin();
    }
  }, [isLoading, user]);

  const value: AuthContextType = {
    user: user ?? null,
    isLoading,
    error: authError || error,
    loginMutation,
    registerMutation,
    logoutMutation,
    getRandomUser,
    getRandomUserAndLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
