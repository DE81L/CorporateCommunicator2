import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '@/i18n';

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'ru';

export interface UserSettings {
  theme: Theme;
  language: Language;
}

interface SettingsContextValue {
  settings: UserSettings;
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: Language) => void;
  updateSettings: (values: Partial<UserSettings>) => void;
}

const defaultSettings: UserSettings = {
  theme: 'system',
  language: 'ru',
};

const SETTINGS_KEY = 'userSettings';

const SettingsContext = createContext<SettingsContextValue | null>(null);

function applyTheme(theme: Theme) {
  document.documentElement.classList.remove('light', 'dark');
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
  } else {
    document.documentElement.classList.add(theme);
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    applyTheme(settings.theme);
    i18n.changeLanguage(settings.language).catch(console.error);
  }, []);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const setTheme = (theme: Theme) => {
    setSettings((prev) => ({ ...prev, theme }));
    applyTheme(theme);
  };

  const setLanguage = (lang: Language) => {
    setSettings((prev) => ({ ...prev, language: lang }));
    i18n.changeLanguage(lang).catch(console.error);
  };

  const updateSettings = (values: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...values }));
    if (values.theme) applyTheme(values.theme);
    if (values.language) i18n.changeLanguage(values.language).catch(console.error);
  };

  return (
    <SettingsContext.Provider value={{ settings, setTheme, setLanguage, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};
