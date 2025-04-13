
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Loader2 } from "lucide-react";

export function LanguageSwitcher() {
    const { t, language, setLanguage } = useLanguage();
    const currentLanguage: string = language;

    const handleLanguageChange = (value: string) => {
      setLanguage(value);
  };


    return (
        <div className="flex flex-col space-y-2">
            <Label htmlFor="language-select">{t('settings.general')}</Label>
      <Select
        value={currentLanguage}
        onValueChange={handleLanguageChange}
      >
        <SelectTrigger id="language-select" className="w-[180px]">
          <SelectValue placeholder={t('settings.language')} />
          {false && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="es">Español</SelectItem>
          <SelectItem value="ru">Русский</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}