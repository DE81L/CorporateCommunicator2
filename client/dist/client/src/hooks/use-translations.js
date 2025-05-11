import { useTranslation } from 'react-i18next';
export function useTranslations() {
    const { t: i18nT, i18n } = useTranslation();
    return {
        t: (key) => i18nT(key),
        i18n,
        currentLanguage: i18n.language,
        changeLanguage: i18n.changeLanguage.bind(i18n),
    };
}
