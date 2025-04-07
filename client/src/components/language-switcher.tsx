import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const changeLanguage = (value: string) => {
    i18n.changeLanguage(value);
  };

  return (
    <div className="flex flex-col space-y-2">
      <Label htmlFor="language-select">{t('settings.language')}</Label>
      <Select
        value={i18n.language}
        onValueChange={changeLanguage}
      >
        <SelectTrigger id="language-select" className="w-[180px]">
          <SelectValue placeholder={t('settings.language')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ru">Русский</SelectItem>
          <SelectItem value="en">English</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}