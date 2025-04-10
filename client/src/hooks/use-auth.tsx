import { createContext, ReactNode, useContext, useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useToast } from "./use-toast";//relative path
import { useLocation } from "wouter";
import { getQueryFn, createApiClient, queryClient } from "../lib/queryClient";//relative path
import { useTranslations } from "./use-translations";//relative path

import { useElectron } from "./use-electron";
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

export type UserWithoutPassword = Omit<User, "password"> & {
  isOnline: number | boolean;
  isAdmin?: number;
};

export interface AuthContextType {
  user: UserWithoutPassword | null;
  isLoading: boolean;
  error: Error | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: z.infer<ReturnType<typeof registerSchema>>) => Promise<void>; 
  sendIPC: any;
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
    username: z.string().min(1, t('auth.usernameRequired')),
    password: z.string().min(1, t('auth.passwordRequired'))
  });


export const registerSchema = (t: (key: string) => string) => {
  const { shape: { username, password } } = createLoginSchema(t);
  const passwordsDontMatch = t('auth.passwordsDontMatch');
  return z.object({ username, password, confirmPassword: z.string() }) 
    .refine(data => data.password === data.confirmPassword, {
      message: passwordsDontMatch,
      path: ["confirmPassword"],
    });
};


export function AuthProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslations();
  const loginSchema = useMemo(() => createLoginSchema((key) => t(key as any)), [t]); // Type casting added here
  const regSchema = useMemo(() => registerSchema((key:string) => t(key as any)), [t]); // Type casting added here
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading] = useState(true);
  const [authError, setAuthError] = useState<Error | null>(null); 
  const { data: user } = useQuery<UserWithoutPassword | null>({
    queryKey: ['/api/user'], queryFn: getQueryFn('returnNull')
  });  
  const loginMutation = useMutation({

    mutationFn: async (credentials: z.infer<typeof loginSchema>) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return res.json();
    }
  });
  
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      setLocation("/auth");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out."
      });
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: z.infer<typeof regSchema> ) => {
      const { confirmPassword, ...data } = userData;

      const { isElectron } = useElectron();
      
      const apiClient = createApiClient(isElectron);
      const res = await apiClient.request("POST", "/api/register", data);

      return res.json();
    }
  });

  // Implement the login/logout methods
  const login = async (username: string, password: string) => {
    console.log("Auth: запускаем вход для", username);
    try {
      await loginMutation.mutateAsync({ username, password });
      setLocation("/");
    } catch (error) {
      if (error instanceof Error) {
        setAuthError(error);
      }
      throw error;
    }
  };

  const logout = async () => {
    console.log("Auth: Выходим из системы");
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      if (error instanceof Error) {
        setAuthError(error);
        toast({
          variant: "destructive",
          title: "Logout failed",
          description: error.message
        });
      }
      throw error;
    }
  };

  const register = async (data: z.infer<typeof regSchema>) => {
    console.log("Auth: Начинаем регистрацию для", data.username, data.email); // optional chaining added here
    try {
      await registerMutation.mutateAsync(data);
      setLocation("/");
    } catch (error) {
      if (error instanceof Error) {
        setAuthError(error);
      }
      throw error;
    }
  };
  useEffect(() => {
    console.log("Auth: Состояние пользователя изменилось", user);
  }, [user]);

  const { api } = useElectron();
  
  const value: AuthContextType = {
    user: user ?? null, 
    isLoading, 
    error: authError,
    login,
    logout,
    register,
    sendIPC:api?.ipcRenderer.send
  };

  return (
    <AuthContext.Provider value={value} >
      {children}
    </AuthContext.Provider>
  );
}

export async function apiRequest(method: string, path: string, body?: unknown) { // export keyword added here
  console.log(`Auth: Запрос к ${path} методом ${method}`);
  const { isElectron } = useElectron();
  const apiClient = createApiClient(isElectron);


  const response = await apiClient.request(method, path, body);

  if (!response.ok) {
    let errorDetails;
    try {
      errorDetails = await response.json();
    } catch (e) {
      errorDetails = { message: `Failed to parse error response: ${response.status}` };
    }

    const errorMessage = errorDetails.message || `HTTP error! Status: ${response.status}`;
    const error = new Error(errorMessage);
    Object.assign(error, errorDetails);
    throw error;
  }


  return response;
}
