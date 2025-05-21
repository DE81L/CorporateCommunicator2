import { useAuth } from "../hooks/use-auth";
import { useTranslations } from "@/hooks/use-translations";
import { useSettings } from "@/context/SettingsContext";
import { useAudioDevices } from "@/hooks/useAudioDevices";
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
  const { t } = useTranslations();
  const { language, setLanguage, audioInputId, setAudioInputId } = useSettings();
  const { devices } = useAudioDevices();

  if (!user) return null;

  return (
    <div className="flex-1 overflow-auto p-6">
      <h2 className="text-xl font-semibold mb-4">{t('settings.title')}</h2>
      <div className="space-y-2 max-w-xs">
        <Label htmlFor="language">{t('settings.language')}</Label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger id="language">
            <SelectValue placeholder={t('settings.language')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ru">Русский</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 max-w-xs mt-4">
        <Label htmlFor="audioInput">{t('settings.audioInput')}</Label>
        <Select
          value={audioInputId ?? 'none'}
          onValueChange={(val) => setAudioInputId(val === 'none' ? null : val)}
        >
          <SelectTrigger id="audioInput">
            <SelectValue placeholder={t('settings.audioInput')} />
          </SelectTrigger>
          <SelectContent>
            {devices.length === 0 ? (
              <SelectItem value="none">{t('settings.noAudioDevices')}</SelectItem>
            ) : (
              devices.map((d) => (
                <SelectItem key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
