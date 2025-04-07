import { useLanguage } from "@/lib/i18n/LanguageContext.tsx";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={language === "ru" ? "default" : "outline"}
        size="sm"
        onClick={() => setLanguage("ru")}
      >
        RU
      </Button>
      <Button
        variant={language === "en" ? "default" : "outline"}
        size="sm"
        onClick={() => setLanguage("en")}
      >
        EN
      </Button>
    </div>
  );
}
