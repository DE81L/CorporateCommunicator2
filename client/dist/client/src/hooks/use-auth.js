import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useCallback, } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast"; // Предполагается использование shadcn/ui toast
import { useTranslations } from '@/hooks/use-translations'; // Предполагается использование переводов
import { createApiClient } from "@/lib/api-client"; // Новый API клиент
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
// Схема валидации для формы входа
const loginSchema = z.object({
    username: z.string().min(1, "Username or email is required"),
    password: z.string().min(1, "Password is required"),
});
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const queryClient = useQueryClient();
    const { t } = useTranslations(); // Хук для переводов
    const { toast } = useToast();
    const apiClient = createApiClient(); // Новый API клиент
    // Запрос для получения текущего пользователя при загрузке приложения
    const { data: user, isLoading: isLoadingUser } = useQuery({
        queryKey: ["/api/user"], // Используем ключ, который будет обновляться при логине/логауте
        queryFn: async () => {
            try {
                return await apiClient.request("/api/user");
            }
            catch (error) {
                if (error instanceof Error && error.message.includes("401")) {
                    return null; // Не авторизован
                }
                throw error;
            }
        },
        staleTime: 5 * 60 * 1000, // Кэшировать данные пользователя на 5 минут
        retry: 1, // Попробовать перезапросить 1 раз при ошибке
    });
    // Мутация для входа
    const loginMutation = useMutation({
        mutationFn: async (credentials) => {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(credentials),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Login failed');
            }
            return response.json();
        },
        onSuccess: (user) => {
            queryClient.setQueryData(["/api/user"], user);
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: t('auth.loginFailed'),
                description: error.message,
            });
        },
    });
    // Мутация для выхода
    const logoutMutation = useMutation({
        mutationFn: async () => {
            return await apiClient.request("/api/logout", { method: "POST" });
        },
        onSuccess: () => {
            // Очищаем данные пользователя в кэше
            queryClient.setQueryData(["/api/user"], null);
            // Можно также сбросить другие связанные кэши, если необходимо
            queryClient.invalidateQueries(); // Инвалидировать все запросы для чистого состояния
            // Навигация на страницу входа обычно происходит в компоненте/роутере
        },
        onError: (error) => {
            console.error("Logout mutation failed:", error);
            // Даже если API выхода не сработал, лучше очистить локальное состояние
            queryClient.setQueryData(["/api/user"], null);
            queryClient.invalidateQueries();
        },
    });
    // Функции, которые будут доступны через контекст
    const login = useCallback(async (credentials) => {
        // Валидация перед вызовом мутации
        const validatedCredentials = loginSchema.parse(credentials);
        return await loginMutation.mutateAsync(validatedCredentials);
    }, [loginMutation, loginSchema]); // Добавлена зависимость loginSchema
    const logout = useCallback(async () => {
        await logoutMutation.mutateAsync();
    }, [logoutMutation]);
    return (_jsx(AuthContext.Provider, { value: {
            user: user ?? null, // Убедимся, что передаем null, если user undefined
            login,
            logout,
            isLoading: isLoadingUser, // Статус загрузки начального пользователя
            isLoggingIn: loginMutation.isPending, // Используем isPending из TanStack Query v5+
            isLoggingOut: logoutMutation.isPending, // Используем isPending из TanStack Query v5+
        }, children: children }));
}
// Хук для использования контекста аутентификации
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
