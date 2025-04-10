import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useToast } from "./use-toast"; 
import { useLocation } from "wouter"; 
import { getQueryFn, createApiClient, queryClient } from "../lib/queryClient";
import { useTranslations } from "./use-translations"; 

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
  error: Error | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: z.infer<ReturnType<typeof registerSchema>>) => Promise<any>;
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

export const apiRequest = async (
  method: string,
  url: string,
  body?: any
): Promise<Response> => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  return fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
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
  const regSchema = useMemo(() => registerSchema((key: string) => t(key as any)), [t]); // Type casting added here
  const { toast } = useToast();
  const [, setLocation] = useLocation();
    const { data: user } = useQuery<UserWithoutPassword | null>({
        queryKey: ['/api/user'], queryFn: getQueryFn('returnNull')
    });
    const [error, setError] = useState<Error | null>(null)
    const loginMutation = useMutation({
        mutationFn: async (credentials: z.infer<typeof loginSchema>) => {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });
            return res.json();
        },
    });
    const logoutMutation = useMutation({
        mutationFn: async () => { await fetch('/api/logout', { method: 'POST' }); },
        onSuccess: () => {
            queryClient.setQueryData(["/api/user"], null);
            setLocation("/auth");
            toast({ title: "Logged out", description: "You have been successfully logged out." });
        }
    });

    const registerMutation = useMutation({
        mutationFn: async (userData: z.infer<typeof regSchema>) => {
            const { confirmPassword, ...data } = userData;
            const { isElectron } = useElectron();
            const apiClient = createApiClient(isElectron);
            const res = await apiClient.request({ method: "POST", url: "/api/register", body: data });
            return res.data;
        },
    });
  return <AuthContext.Provider value={{
        sendIPC: null,
        login: loginMutation.mutate,
        logout: logoutMutation.mutate,
        register: registerMutation.mutate,
        user, error
      }}>{children}</AuthContext.Provider>;
}
