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
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from '@/hooks/use-translations';

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
  const apiClient   = createApiClient();
  const queryClient = useQueryClient();
  const { toast }   = useToast();
  const { t }       = useTranslations();

  /* ─── Текущий пользователь ───────────────────────────── */
  const {
    data: user = null,
    isLoading: isLoadingUser,
  } = useQuery<UserWithoutPassword | null>({
    queryKey: ['/user'],
    queryFn : async () =>
      (await apiClient.request<UserWithoutPassword | null>('/user')) ?? null,
    gcTime  : 5 * 60 * 1000,
  });

  /* ─── Логин ───────────────────────────────────────────── */
  const loginMutation = useMutation({
    mutationFn : async (c: LoginCredentials) => {
      const res = await apiClient.request<UserWithoutPassword>('/login', {
        method : 'POST',
        body   : JSON.stringify(c),
      });
      if (!res) throw new Error('Login returned empty payload');
      return res;
    },
    onSuccess: (u) => {
      queryClient.setQueryData(['/user'], u);
      toast({ title: t('auth.loginSuccess') });
    },
    onError: () => toast({ title: t('auth.loginFailed'), variant: 'destructive' }),
  });

  /* ─── Логаут ──────────────────────────────────────────── */
  const logoutMutation = useMutation({
    mutationFn : () =>
      apiClient.request('/logout', { method: 'POST' }).then(() => undefined),
    onSuccess  : () => {
      queryClient.setQueryData(['/user'], null);
      queryClient.invalidateQueries();
    },
  });

  /* ─── Публичное API ──────────────────────────────────── */
  const login = useCallback(
    (c: LoginCredentials) => loginMutation.mutateAsync(loginSchema.parse(c)),
    [loginMutation],
  );

  const logout = useCallback(
    () => logoutMutation.mutateAsync(),
    [logoutMutation],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading   : isLoadingUser,
        isLoggingIn : loginMutation.isPending,
        isLoggingOut: logoutMutation.isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
