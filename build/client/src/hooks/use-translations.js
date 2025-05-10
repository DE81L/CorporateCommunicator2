"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTranslations = useTranslations;
const react_i18next_1 = require("react-i18next");
function useTranslations() {
    const { t: i18nT, i18n } = (0, react_i18next_1.useTranslation)();
    return {
        t: (key) => i18nT(key),
        i18n,
        currentLanguage: i18n.language,
        changeLanguage: i18n.changeLanguage.bind(i18n),
    };
}
