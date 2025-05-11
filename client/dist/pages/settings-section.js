import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuth } from "../hooks/use-auth";
export default function SettingsSection() {
    const { user } = useAuth();
    if (!user)
        return null;
    return (_jsxs("div", { className: "flex-1 overflow-auto p-6", children: [_jsx("h2", { children: "Settings" }), _jsx("p", { children: "Nothing here yet \u2013 wire up your preferences UI later." })] }));
}
