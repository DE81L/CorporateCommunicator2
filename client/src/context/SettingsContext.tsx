import React, { createContext, useContext, useEffect, useState } from 'react';
import i18n from '@/i18n';

export type Theme = 'light' | 'dark' | 'system';

interface SettingsContextType {
  theme: Theme;
  language: string;
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

function applyTheme(theme: Theme) {
  document.documentElement.classList.remove('light', 'dark');
  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.classList.add(systemTheme);
  } else {
    document.documentElement.classList.add(theme);
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [language, setLanguageState] = useState<string>(i18n.language || 'en');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const storedLang = localStorage.getItem('language');
    if (storedTheme) {
      setThemeState(storedTheme);
      applyTheme(storedTheme);
    }
    if (storedLang) {
      setLanguageState(storedLang);
      i18n.changeLanguage(storedLang).catch(console.error);
    }
  }, []);

  const setTheme = (value: Theme) => {
    setThemeState(value);
    localStorage.setItem('theme', value);
    applyTheme(value);
  };

  const setLanguage = async (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    await i18n.changeLanguage(lang);
  };

  return (
    <SettingsContext.Provider value={{ theme, language, setTheme, setLanguage }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
