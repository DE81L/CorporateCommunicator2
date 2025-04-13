import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import i18n from '../i18n';

export function LanguageSwitcher() {
  const currentLanguage = i18n.language;

  const handleLanguageChange = async (value: string) => {
    await i18n.changeLanguage(value);
  };

  return (
    <div className="flex flex-col space-y-2">
      <Label htmlFor="language-select">{i18n.t('settings.general')}</Label>
      <Select
        value={currentLanguage}
        onValueChange={handleLanguageChange}
      >
        <SelectTrigger id="language-select" className="w-[180px]">
          <SelectValue placeholder={i18n.t('settings.language')} />
          {false && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="es">Español</SelectItem>
          <SelectItem value="ru">Русский</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}