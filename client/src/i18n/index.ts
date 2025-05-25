import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { showError } from '@/lib/error-toast';

// Импорт переводов
import translationEN from './locales/en.json';
import translationRU from './locales/ru.json';

const resources = {
  en: {
    translation: translationEN
  },
  ru: {
    translation: translationRU
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    initImmediate: false,
    resources,
    supportedLngs: ['ru','ru-RU','en'],
    fallbackLng: 'ru',
    returnNull: false,
    returnEmptyString: false,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    debug: import.meta.env.DEV // Включаем отладку в разработке
  })
  .catch(error => {
    showError(error, 'i18n initialization error');
  });
  
// Устанавливаем русский язык по умолчанию, если язык не определён
if (!i18n.language) {
    i18n.changeLanguage('ru');
}

export default i18n;
