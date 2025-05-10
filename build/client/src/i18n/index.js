"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const i18next_1 = __importDefault(require("i18next"));
const react_i18next_1 = require("react-i18next");
const i18next_browser_languagedetector_1 = __importDefault(require("i18next-browser-languagedetector"));
// Import translations
const en_json_1 = __importDefault(require("./locales/en.json"));
const ru_json_1 = __importDefault(require("./locales/ru.json"));
const resources = {
    en: {
        translation: en_json_1.default
    },
    ru: {
        translation: ru_json_1.default
    }
};
i18next_1.default
    .use(i18next_browser_languagedetector_1.default)
    .use(react_i18next_1.initReactI18next)
    .init({
    initImmediate: false,
    resources,
    supportedLngs: ['ru', 'ru-RU', 'en'],
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
    debug: import.meta.env.DEV // Enable debug in development
})
    .catch(error => {
    console.error('i18n initialization error:', error);
});
// Set language to Russian by default if not detected
if (!i18next_1.default.language) {
    i18next_1.default.changeLanguage('ru');
}
exports.default = i18next_1.default;
