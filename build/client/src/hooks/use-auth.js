"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthProvider = AuthProvider;
exports.useAuth = useAuth;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const zod_1 = require("zod");
const use_toast_1 = require("@/hooks/use-toast"); // Предполагается использование shadcn/ui toast
const use_translations_1 = require("@/hooks/use-translations"); // Предполагается использование переводов
const api_client_1 = require("@/lib/api-client"); // Новый API клиент
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
// Схема валидации для формы входа
const loginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, "Username or email is required"),
    password: zod_1.z.string().min(1, "Password is required"),
});
const AuthContext = (0, react_1.createContext)(undefined);
function AuthProvider({ children }) {
    const queryClient = (0, react_query_1.useQueryClient)();
    const { t } = (0, use_translations_1.useTranslations)(); // Хук для переводов
    const { toast } = (0, use_toast_1.useToast)();
    const apiClient = (0, api_client_1.createApiClient)(); // Новый API клиент
    // Запрос для получения текущего пользователя при загрузке приложения
    const { data: user, isLoading: isLoadingUser } = (0, react_query_1.useQuery)({
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
    const loginMutation = (0, react_query_1.useMutation)({
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
    const logoutMutation = (0, react_query_1.useMutation)({
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
    const login = (0, react_1.useCallback)(async (credentials) => {
        // Валидация перед вызовом мутации
        const validatedCredentials = loginSchema.parse(credentials);
        return await loginMutation.mutateAsync(validatedCredentials);
    }, [loginMutation, loginSchema]); // Добавлена зависимость loginSchema
    const logout = (0, react_1.useCallback)(async () => {
        await logoutMutation.mutateAsync();
    }, [logoutMutation]);
    return (<AuthContext.Provider value={{
            user: user ?? null, // Убедимся, что передаем null, если user undefined
            login,
            logout,
            isLoading: isLoadingUser, // Статус загрузки начального пользователя
            isLoggingIn: loginMutation.isPending, // Используем isPending из TanStack Query v5+
            isLoggingOut: logoutMutation.isPending, // Используем isPending из TanStack Query v5+
        }}>
      {children}
    </AuthContext.Provider>);
}
// Хук для использования контекста аутентификации
function useAuth() {
    const context = (0, react_1.useContext)(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
// // Типы User и InsertUser, если они используются только здесь
// export type User = z.infer<typeof UserSchema>;
// export type InsertUser = z.infer<typeof InsertUserSchema>;
// // Переместите или удалите, если они определены глобально
