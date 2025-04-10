const i18next = require('i18next');
const translationRU = require('../client/src/i18n/locales/ru.json');
const translationEN = require('../client/src/i18n/locales/en.json');

const resources = {
  ru: {
    translation: translationRU
  },
  en: {
    translation: translationEN
  }
};

i18next.init({
  resources,
  lng: 'ru',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
}).catch(error => {
  console.error('Electron i18n initialization error:', error);
});

module.exports = i18next;