export enum TranslationKey {
  // Переместите сюда все ключи переводов из client/src/types.ts
}

// Переместите сюда пользовательские типы и другие общие интерфейсы
export interface User {
  // ...существующий тип пользователя...
}

// Добавьте вспомогательные функции
export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
};

// Добавьте типы состояния соединения
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';
