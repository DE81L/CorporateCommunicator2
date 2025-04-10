import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { useToast } from './use-toast';
import type { TranslationKey } from '@/lib/i18n/translations';

export function useTranslations() {
  const { t: translate, i18n } = useTranslation();
  const { toast } = useToast();

  const t = useCallback((key: TranslationKey) => {
    return translate(key);
  }, [translate]);

  const changeLanguage = useCallback(async (language: string) => {
    try {
      await i18n.changeLanguage(language);
      localStorage.setItem('preferredLanguage', language);
      
      toast({
        title: t('settings.changesApplied' as TranslationKey),
        description: t('settings.changesApplied' as TranslationKey),
      });
    } catch (error) {
      console.error('Language change failed:', error);
      
      toast({
        variant: 'destructive',
        title: t('errors.languageChangeFailed' as TranslationKey),
        description: t('errors.tryAgainLater' as TranslationKey),
      });
    }
  }, [i18n, translate, toast]);

  return {
    t,
    i18n,
    currentLanguage: i18n.language,
    changeLanguage
  };
}