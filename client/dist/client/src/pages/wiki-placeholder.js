import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
export default function WikiPlaceholder() {
    const { t } = useTranslation();
    return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "\uD83D\uDCDA Wiki" }), _jsx("p", { className: "text-gray-600", children: "This feature is temporarily unavailable." })] }) }));
}
