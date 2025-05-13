import { useTranslation } from 'react-i18next';
import type { TFunction, i18n as I18n } from 'i18next';

export interface UseTranslationsResult {
  t: TFunction;
  i18n: I18n;
  currentLanguage: string;
  changeLanguage: I18n['changeLanguage'];
}

export function useTranslations(): UseTranslationsResult {
  const { t: i18nT, i18n } = useTranslation();
  return {
    t: i18nT,
    i18n,
    currentLanguage: i18n.language,
    changeLanguage: i18n.changeLanguage.bind(i18n),
  };
}
