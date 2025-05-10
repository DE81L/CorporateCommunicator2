"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageSwitcher = LanguageSwitcher;
const select_1 = require("@/components/ui/select");
const label_1 = require("@/components/ui/label");
const lucide_react_1 = require("lucide-react");
const i18n_1 = __importDefault(require("../i18n"));
function LanguageSwitcher() {
    const currentLanguage = i18n_1.default.language;
    const handleLanguageChange = async (value) => {
        await i18n_1.default.changeLanguage(value);
    };
    return (<div className="flex flex-col space-y-2">
      <label_1.Label htmlFor="language-select">{i18n_1.default.t('settings.general')}</label_1.Label>
      <select_1.Select value={currentLanguage} onValueChange={handleLanguageChange}>
        <select_1.SelectTrigger id="language-select" className="w-[180px]">
          <select_1.SelectValue placeholder={i18n_1.default.t('settings.language')}/>
          {false && <lucide_react_1.Loader2 className="h-4 w-4 animate-spin ml-2"/>}
        </select_1.SelectTrigger>
        <select_1.SelectContent>
          <select_1.SelectItem value="en">English</select_1.SelectItem>
          <select_1.SelectItem value="es">Español</select_1.SelectItem>
          <select_1.SelectItem value="ru">Русский</select_1.SelectItem>
        </select_1.SelectContent>
      </select_1.Select>
    </div>);
}
