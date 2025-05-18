import { useAuth } from "../hooks/use-auth";
import { useTranslations } from "@/hooks/use-translations";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function SettingsSection() {
  const { user } = useAuth();
  const { t, currentLanguage, changeLanguage } = useTranslations();

  if (!user) return null;

  return (
    <div className="flex-1 overflow-auto p-6">
      <h2 className="text-xl font-semibold mb-4">{t('settings.title')}</h2>
      <div className="space-y-2 max-w-xs">
        <Label htmlFor="language">{t('settings.language')}</Label>
        <Select value={currentLanguage} onValueChange={changeLanguage}>
          <SelectTrigger id="language">
            <SelectValue placeholder={t('settings.language')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ru">Русский</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
