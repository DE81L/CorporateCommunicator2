import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import i18n from '../i18n';
export function LanguageSwitcher() {
    const currentLanguage = i18n.language;
    const handleLanguageChange = async (value) => {
        await i18n.changeLanguage(value);
    };
    return (_jsxs("div", { className: "flex flex-col space-y-2", children: [_jsx(Label, { htmlFor: "language-select", children: i18n.t('settings.general') }), _jsxs(Select, { value: currentLanguage, onValueChange: handleLanguageChange, children: [_jsxs(SelectTrigger, { id: "language-select", className: "w-[180px]", children: [_jsx(SelectValue, { placeholder: i18n.t('settings.language') }), false && _jsx(Loader2, { className: "h-4 w-4 animate-spin ml-2" })] }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "en", children: "English" }), _jsx(SelectItem, { value: "es", children: "Espa\u00F1ol" }), _jsx(SelectItem, { value: "ru", children: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439" })] })] })] }));
}
