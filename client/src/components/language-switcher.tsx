import React from 'react';
import { useTranslations } from '@/hooks/use-translations';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export function LanguageSwitcher() {
  const { t, currentLanguage, changeLanguage, isChangingLanguage } = useTranslations();

  const handleLanguageChange = async (value: string) => {
    await changeLanguage(value);
  };

  return (
    <div className="flex flex-col space-y-2">
      <Label htmlFor="language-select">{t('settings.language')}</Label>
      <Select
        value={currentLanguage}
        onValueChange={handleLanguageChange}
        disabled={isChangingLanguage}
      >
        <SelectTrigger id="language-select" className="w-[180px]">
          <SelectValue placeholder={t('settings.language')} />
          {isChangingLanguage && (
            <Loader2 className="h-4 w-4 animate-spin ml-2" />
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ru">Русский</SelectItem>
          <SelectItem value="en">English</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}