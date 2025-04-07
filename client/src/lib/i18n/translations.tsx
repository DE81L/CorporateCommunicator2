import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  FC,
} from "react";

export type Language = "ru" | "en";

export interface TranslationShape {
  [key: string]: string;
}

export type TranslationKey = keyof TranslationShape;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: "ru", // Default language
  setLanguage: () => {}, // No-op setLanguage
  t: (key: TranslationKey) => String(key), // Returns the key as string if translation is missing
});

export const LanguageProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>("ru");

  const t = (key: TranslationKey): string => {
    return translations[language][key] || String(key);
  };

  const contextValue: LanguageContextType = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  return context;
};

export const translations: Record<Language, TranslationShape> = {
  ru: {
    "navigation.messages": "Сообщения",
    "navigation.groups": "Группы",
    "navigation.announcements": "Объявления",
    "navigation.requests": "Заявки",
    "navigation.contacts": "Контакты",
    "navigation.settings": "Настройки",
    "header.title": "Nexus",
    "call.video": "Видеозвонок",
    "call.audio": "Голосовой звонок",
    "call.in_progress": "в процессе...",
    "call.end": "Завершить",
    "system_info.title": "Информация о приложении",
    "system_info.connection_status": "Статус подключения",
    "system_info.app_version": "Версия приложения",
    "system_info.system_info": "Системная информация",
    "system_info.platform": "Платформа",
    "system_info.architecture": "Архитектура",
    "system_info.node_version": "Версия Node",
    "system_info.memory": "Память",
    "system_info.total_memory": "Всего памяти",
    "system_info.free_memory": "Свободно памяти",
    "system_info.used_memory": "Использовано памяти",
    "system_info.local_storage": "Локальное хранилище",
    "system_info.status": "Статус",
    "system_info.refresh": "Обновить информацию",
    "connection.connected": "Подключено",
    "connection.offline": "Офлайн режим",
    "connection.connecting": "Подключение...",
    "connection.disconnected": "Отключено",
    "connection.open": "Подключено",
    "connection.closing": "Отключение...",
    "connection.closed": "Отключено",
    "profile.my_account": "Мой аккаунт",
    "profile.profile": "Профиль",
    "profile.settings": "Настройки",
    "profile.sign_out": "Выйти",
    "profile.signing_out": "Выход...",
    "sidebar.messages": "Сообщения",
    "sidebar.groups": "Группы",
    "sidebar.announcements": "Объявления",
    "sidebar.requests": "Заявки",
    "sidebar.contacts": "Контакты",
    "sidebar.settings": "Настройки",
    "sidebar.new_messages": "Новые сообщения",
    "sidebar.close_sidebar": "Закрыть боковое меню",
    "sidebar.connection_status.online": "В сети",
    "sidebar.connection_status.offline": "Не в сети",
    "sidebar.connection_status.connecting": "Подключение...",
    "sidebar.connection_status.disconnected": "Отключено",
  },
  en: {
    "navigation.messages": "Messages",
    "navigation.groups": "Groups",
    "navigation.announcements": "Announcements",
    "navigation.requests": "Requests",
    "navigation.contacts": "Contacts",
    "navigation.settings": "Settings",
    "header.title": "Nexus",
    "call.video": "Video call",
    "call.audio": "Voice call",
    "call.in_progress": "in progress...",
    "call.end": "End Call",
    "system_info.title": "Desktop App Information",
    "system_info.connection_status": "Connection Status",
    "system_info.app_version": "App Version",
    "system_info.system_info": "System Information",
    "system_info.platform": "Platform",
    "system_info.architecture": "Architecture",
    "system_info.node_version": "Node Version",
    "system_info.memory": "Memory",
    "system_info.total_memory": "Total Memory",
    "system_info.free_memory": "Free Memory",
    "system_info.used_memory": "Used Memory",
    "system_info.local_storage": "Local Storage",
    "system_info.status": "Status",
    "system_info.refresh": "Refresh System Info",
    "connection.connected": "Connected",
    "connection.offline": "Offline Mode",
    "connection.connecting": "Connecting...",
    "connection.disconnected": "Disconnected",
    "connection.open": "Connected",
    "connection.closing": "Disconnecting...",
    "connection.closed": "Disconnected",
    "profile.my_account": "My Account",
    "profile.profile": "Profile",
    "profile.settings": "Settings",
    "profile.sign_out": "Sign out",
    "profile.signing_out": "Signing out...",
    "sidebar.messages": "Messages",
    "sidebar.groups": "Groups",
    "sidebar.announcements": "Announcements",
    "sidebar.requests": "Requests",
    "sidebar.contacts": "Contacts",
    "sidebar.settings": "Settings",
    "sidebar.new_messages": "New messages",
    "sidebar.close_sidebar": "Close sidebar",
    "sidebar.connection_status.online": "Online",
    "sidebar.connection_status.offline": "Offline",
    "sidebar.connection_status.connecting": "Connecting...",
    "sidebar.connection_status.disconnected": "Disconnected",
  },
};
