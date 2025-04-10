import { createContext, ReactNode, useContext, useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useToast } from "./use-toast";//relative path
import { useLocation } from "wouter";
import { getQueryFn, createApiClient, queryClient } from "../lib/queryClient\";//relative path
import { useTranslations } from "./use-translations\";//relative path

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
    username: z.string().min(1, t('auth.usernameRequired')),\n    password: z.string().min(1, t('auth.passwordRequired\'))
  });


export const registerSchema = (t: (key: string) => string) => {
  const { shape: { username, password } } = createLoginSchema(t);
  const passwordsDontMatch = t('auth.passwordsDontMatch');
  return z.object({ username, password, confirmPassword: z.string() }) 
    .refine(data => data.password === data.confirmPassword, {
      message: passwordsDontMatch,\n      path: [\"confirmPassword\"],\n    });
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
    queryKey: ['/api/user'], queryFn: getQueryFn('returnNull\')
  });  
  const loginMutation = useMutation({\n\n    mutationFn: async (credentials: z.infer<typeof loginSchema>) => {
      const res = await apiRequest(\"POST\", \"/api/login\", credentials);
      return res.json();
    }
  });
  
  const logoutMutation = useMutation({\n    mutationFn: async () => {\n      await apiRequest(\"POST\", \"/api/logout\");
    },\n    onSuccess: () => {\n      queryClient.setQueryData([\"/api/user\"], null);
      setLocation(\"/auth\");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out."
      });
    }
  });

  const registerMutation = useMutation({\n    mutationFn: async (userData: z.infer<typeof regSchema> ) => {
      const { confirmPassword, ...data } = userData;

      const { isElectron } = useElectron();
      
      const apiClient = createApiClient(isElectron);
      const res = await apiClient.request(\