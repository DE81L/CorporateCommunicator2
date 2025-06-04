import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
} from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';
import { createApiClient } from '@/lib/api-client';
import { useTranslations } from '@/hooks/use-translations';
import { showError } from '@/lib/error-toast';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
export type LoginCredentials = z.infer<typeof loginSchema>;

export interface UserWithoutPassword {
  id: number;
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  jobId?: number | null;
  jobTitle?: string | null;
  departmentId?: number | null;
  isAdmin?: number;
  isOnline: boolean | number;
  avatarUrl: string | null;
}

export interface AuthContextType {
  user: UserWithoutPassword | null;
  login: (c: LoginCredentials) => Promise<UserWithoutPassword>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isLoggingIn: boolean;
  isLoggingOut: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const apiClient = createApiClient();
  const queryClient = useQueryClient();
  const { t } = useTranslations();

  /* ─── CURRENT USER ────────────────────────────────────── */
  const {
    data: rawUser,
    isLoading: isLoadingUser,
  } = useQuery<UserWithoutPassword | null, Error>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      try {
        return (await apiClient.request<UserWithoutPassword>('/user')) ?? null;
      } catch (error) {
        if (error instanceof Error && error.message.includes('401')) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 5 * 60_000,
    retry: 1,
  }); // rawUser: UserWithoutPassword | null | undefined :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1}

  // ✂️ приводим undefined → null, чтобы соответствовать AuthContextType
  const user: UserWithoutPassword | null = rawUser ?? null;

  /* ─── LOGIN ───────────────────────────────────────────── */
  const loginMutation = useMutation<
    UserWithoutPassword,
    Error,
    LoginCredentials
  >({
    mutationFn: async (credentials) =>
      (await apiClient.request<UserWithoutPassword>('/login', {
        method: 'POST',
        body: JSON.stringify({
          usernameOrEmail: credentials.username,
          password: credentials.password,
        }),
        headers: { 'Content-Type': 'application/json' },
      }))!,
    onSuccess: (user) => {
      queryClient.setQueryData(['/api/user'], user);
    },
    onError: (error) => {
      showError(error, t('auth.loginFailed'));
    },
  });

  /* ─── LOGOUT ──────────────────────────────────────────── */
  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiClient.request('/logout', { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/user'], null);
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      showError(error, 'Logout failed');
      queryClient.setQueryData(['/api/user'], null);
      queryClient.invalidateQueries();
    },
  });

  const login = useCallback(
    (c: LoginCredentials) => loginMutation.mutateAsync(loginSchema.parse(c)),
    [loginMutation]
  );
  const logout = useCallback(async (): Promise<void> => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  /* ─── RENDER ──────────────────────────────────────────── */
  return (
    <AuthContext.Provider
      value={{
        user,
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
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
