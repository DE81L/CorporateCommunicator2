// client/src/lib/i18n/translations.ts
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export type Language = 'ru' | 'en';

export const translations = {
  en: {
    common: {
      appName: "Nexus",
      loading: "Loading...",
      save: 'Save',
      cancel: 'Cancel',
    },
    auth: {
      login: "Login",
      register: "Register",
      usernameRequired: "Username is required",
      passwordRequired: "Password is required",
      passwordsDontMatch: "Passwords don't match"
    },
    call: {
      audio: "Audio Call",
      video: "Video Call",
      in_progress: "Call in Progress"
    },
    settings: {
      language: 'Language',
      changesApplied: 'Changes applied',
    },
  },
  ru: {
    common: {
      save: 'Сохранить',
      cancel: 'Отмена',
      // …
    },
    settings: {
      language: 'Язык',
      changesApplied: 'Изменения сохранены',
      // …
    },
    // Russian translations...
  },
} as const;

export type TranslationKey = 
  | `common.${keyof typeof translations.en.common}`
  | `auth.${keyof typeof translations.en.auth}`
  | `call.${keyof typeof translations.en.call}`;

export function useLanguage() {
  const { t, i18n } = useTranslation();
  
  const setLanguage = useCallback((lang: string) => {
    i18n.changeLanguage(lang);
  }, [i18n]);

  return {
    t,
    language: i18n.language,
    setLanguage
  };
}
