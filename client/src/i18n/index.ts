import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import translationEN from './locales/en.json';
import translationRU from './locales/ru.json';

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: translationEN
      },
      ru: {
        translation: translationRU
      }
    },
    lng: 'ru', // Default language is Russian
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false // React already does escaping
    }
  });

export default i18n;