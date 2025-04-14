import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast"; // Предполагается использование shadcn/ui toast
import { useTranslations } from '@/hooks/use-translations'; // Предполагается использование переводов

// Схема валидации для формы входа
const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

// Тип пользователя (без пароля)
export interface UserWithoutPassword {
  id: number;
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  isOnline: boolean | number; // Учитывая возможное представление в БД
  avatarUrl: string | null;
  // Добавьте другие поля пользователя, если они есть
}

export interface AuthContextType {
  user: UserWithoutPassword | null;
  login: (credentials: LoginCredentials) => Promise<UserWithoutPassword>;
  logout: () => Promise<void>;
  isLoading: boolean; // Общий статус загрузки (например, при начальной проверке пользователя)
  isLoggingIn: boolean; // Статус загрузки для операции входа
  isLoggingOut: boolean; // Статус загрузки для операции выхода
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { t } = useTranslations(); // Хук для переводов
  const { toast } = useToast();

  // Запрос для получения текущего пользователя при загрузке приложения
  const { data: user, isLoading: isLoadingUser } = useQuery<UserWithoutPassword | null>({
    queryKey: ["/api/user"], // Используем ключ, который будет обновляться при логине/логауте
    queryFn: async () => {
      try {
        const res = await fetch("/api/user"); // Эндпоинт для проверки сессии/токена
        if (res.status === 401) {
          return null; // Не авторизован
        }
        if (!res.ok) {
          throw new Error("Failed to fetch user data");
        }
        const userData = await res.json();
        // Убедимся, что возвращаем null, если пользователя нет, а не пустой объект или ошибку
        return userData && userData.id ? userData : null;
      } catch (error) {
        console.error("Error fetching initial user:", error);
        return null; // Возвращаем null при ошибке
      }
    },
    staleTime: 5 * 60 * 1000, // Кэшировать данные пользователя на 5 минут
    retry: 1, // Попробовать перезапросить 1 раз при ошибке
  });

  // Мутация для входа
  const loginMutation = useMutation({
    // --- НАЧАЛО ИЗМЕНЕНИЯ: Хардкодный вход ---
    mutationFn: async (credentials: LoginCredentials): Promise<UserWithoutPassword> => {
      console.log("Attempting hardcoded login with:", credentials);

      // Хардкодные данные пользователей
      const user1: UserWithoutPassword = {
        id: 3, // ID для user1
        username: "user1",
        email: "user1@example.com",
        firstName: "User",
        lastName: "One",
        isOnline: true,
        avatarUrl: null
      };

      const user2: UserWithoutPassword = {
        id: 4, // ID для user2 (пример)
        username: "user2",
        email: "user2@example.com",
        firstName: "User",
        lastName: "Two",
        isOnline: true,
        avatarUrl: null
      };

      // Имитация задержки сети
      await new Promise(resolve => setTimeout(resolve, 300));

      // Проверка, каким пользователем пытаемся войти
      if (credentials.username === "user1" || credentials.username === "user1@example.com") {
        console.log("Hardcoding login for user1");
        return user1;
      }

      if (credentials.username === "user2" || credentials.username === "user2@example.com") {
        console.log("Hardcoding login for user2");
        return user2;
      }

      // Если это не user1 или user2, имитируем ошибку
      console.log("Hardcoded login failed for:", credentials.username);
      throw new Error(t("auth.invalidCredentials")); // Используем перевод для сообщения об ошибке
    },
    // --- КОНЕЦ ИЗМЕНЕНИЯ ---
    onSuccess: (loggedInUser) => {
      console.log("Hardcoded login mutation succeeded for:", loggedInUser);
      // Обновляем данные пользователя в кэше React Query
      queryClient.setQueryData(["/api/user"], loggedInUser);
      toast({
        title: t('auth.loginSuccessTitle'), // "Login Successful"
        description: t('auth.welcomeBack', { name: loggedInUser.firstName || loggedInUser.username }), // "Welcome back, {name}!"
      });
      // Навигация должна происходить в компоненте, который вызвал login
    },
    onError: (error: Error) => {
      console.error("Hardcoded login mutation failed:", error);
      toast({
        title: t('auth.loginFailed'), // "Login Failed"
        description: error.message, // Показываем сообщение из ошибки (включая "Invalid credentials")
        variant: "destructive",
      });
    },
  });

  // Мутация для выхода
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Здесь можно оставить реальный запрос на выход, если он есть,
      // или просто очистить состояние на клиенте
      try {
        const res = await fetch('/api/logout', { method: 'POST' });
        if (!res.ok && res.status !== 401) { // Игнорируем 401, если пользователь уже не авторизован
          console.warn("Logout API call failed:", res.statusText);
          // Можно не выбрасывать ошибку, чтобы выход на клиенте все равно произошел
        }
      } catch (error) {
         console.error("Error during logout API call:", error);
         // Все равно продолжаем выход на клиенте
      }
    },
    onSuccess: () => {
      // Очищаем данные пользователя в кэше
      queryClient.setQueryData(["/api/user"], null);
      // Можно также сбросить другие связанные кэши, если необходимо
      queryClient.invalidateQueries(); // Инвалидировать все запросы для чистого состояния
      toast({
        title: t('auth.logoutSuccessTitle'), // "Logged Out"
        description: t('auth.logoutSuccessDesc'), // "You have been successfully logged out."
      });
      // Навигация на страницу входа обычно происходит в компоненте/роутере
    },
     onError: (error: Error) => {
      console.error("Logout mutation failed:", error);
       // Даже если API выхода не сработал, лучше очистить локальное состояние
       queryClient.setQueryData(["/api/user"], null);
       queryClient.invalidateQueries();
      toast({
        title: t('auth.logoutFailed'), // "Logout Failed"
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Функции, которые будут доступны через контекст
  const login = useCallback(async (credentials: LoginCredentials): Promise<UserWithoutPassword> => {
    // Валидация перед вызовом мутации
    const validatedCredentials = loginSchema.parse(credentials);
    return await loginMutation.mutateAsync(validatedCredentials);
  }, [loginMutation, loginSchema]); // Добавлена зависимость loginSchema

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null, // Убедимся, что передаем null, если user undefined
        login,
        logout,
        isLoading: isLoadingUser, // Статус загрузки начального пользователя
        isLoggingIn: loginMutation.isPending, // Используем isPending из TanStack Query v5+
        isLoggingOut: logoutMutation.isPending, // Используем isPending из TanStack Query v5+
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Хук для использования контекста аутентификации
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// // Типы User и InsertUser, если они используются только здесь
// export type User = z.infer<typeof UserSchema>;
// export type InsertUser = z.infer<typeof InsertUserSchema>;
// // Переместите или удалите, если они определены глобально