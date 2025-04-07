import React, { createContext, useContext, useState } from "react";
import { translations, Language, TranslationKey } from "./translations.tsx";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("ru");

  const t = (key: TranslationKey): string => {
    const parts = key.toString().split(".");
    let result: any = translations[language];
    for (const part of parts) {
      result = result[part];
      if (result === undefined) {
        console.warn(`Translation missing for key: ${key}`);
        return key.toString();
      }
    }
    return result as string;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
