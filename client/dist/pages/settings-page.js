import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useTranslations } from '@/hooks/use-translations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger, } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Bell, Moon, Sun, Globe, User, Lock, Settings as SettingsIcon } from 'lucide-react';
const SettingsPage = () => {
    const { t, currentLanguage, changeLanguage } = useTranslations();
    const { toast } = useToast();
    const [theme, setTheme] = React.useState('system');
    const [emailNotifications, setEmailNotifications] = React.useState(true);
    const [pushNotifications, setPushNotifications] = React.useState(true);
    const [desktopNotifications, setDesktopNotifications] = React.useState(true);
    const handleThemeChange = (value) => {
        setTheme(value);
        // Apply theme change logic here
        document.documentElement.classList.remove('light', 'dark');
        if (value === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';
            document.documentElement.classList.add(systemTheme);
        }
        else {
            document.documentElement.classList.add(value);
        }
        toast({
            title: t('settings.changesApplied'),
            description: t('settings.theme') + ': ' +
                (value === 'light'
                    ? t('settings.lightMode')
                    : value === 'dark'
                        ? t('settings.darkMode')
                        : t('settings.system')),
            duration: 2000,
        });
    };
    const handleNotificationChange = (type, value) => {
        switch (type) {
            case 'email':
                setEmailNotifications(value);
                break;
            case 'push':
                setPushNotifications(value);
                break;
            case 'desktop':
                setDesktopNotifications(value);
                break;
        }
        toast({
            title: t('settings.changesApplied'),
            description: value
                ? `${t('settings.' + type + 'Notifications')} ${t('common.enabled')}`
                : `${t('settings.' + type + 'Notifications')} ${t('common.disabled')}`,
            duration: 2000,
        });
    };
    return (_jsxs("div", { className: "container mx-auto py-10", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsx("h1", { className: "text-3xl font-bold", children: t('settings.title') }), _jsx(SettingsIcon, { className: "h-6 w-6" })] }), _jsxs(Tabs, { defaultValue: "general", className: "w-full", children: [_jsxs(TabsList, { className: "grid grid-cols-4 mb-8", children: [_jsxs(TabsTrigger, { value: "general", className: "flex items-center gap-2", children: [_jsx(SettingsIcon, { className: "h-4 w-4" }), _jsx("span", { children: t('settings.general') })] }), _jsxs(TabsTrigger, { value: "account", className: "flex items-center gap-2", children: [_jsx(User, { className: "h-4 w-4" }), _jsx("span", { children: t('settings.account') })] }), _jsxs(TabsTrigger, { value: "privacy", className: "flex items-center gap-2", children: [_jsx(Lock, { className: "h-4 w-4" }), _jsx("span", { children: t('settings.privacy') })] }), _jsxs(TabsTrigger, { value: "notifications", className: "flex items-center gap-2", children: [_jsx(Bell, { className: "h-4 w-4" }), _jsx("span", { children: t('settings.notifications') })] })] }), _jsx(TabsContent, { value: "general", children: _jsxs("div", { className: "grid gap-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: t('settings.appearance') }), _jsx(CardDescription, { children: t('settings.customizeAppearance') })] }), _jsx(CardContent, { className: "space-y-4", children: _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "theme", children: t('settings.theme') }), _jsxs(Select, { value: theme, onValueChange: (value) => handleThemeChange(value), children: [_jsx(SelectTrigger, { id: "theme", children: _jsx(SelectValue, { placeholder: t('settings.theme') }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "light", className: "flex items-center gap-2", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Sun, { className: "h-4 w-4" }), _jsx("span", { children: t('settings.lightMode') })] }) }), _jsx(SelectItem, { value: "dark", className: "flex items-center gap-2", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Moon, { className: "h-4 w-4" }), _jsx("span", { children: t('settings.darkMode') })] }) }), _jsx(SelectItem, { value: "system", children: "System" })] })] })] }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: t('settings.language') }), _jsx(CardDescription, { children: t('settings.changeLanguage') })] }), _jsx(CardContent, { className: "space-y-4", children: _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "language", children: t('settings.language') }), _jsxs(Select, { value: currentLanguage, onValueChange: changeLanguage, children: [_jsxs(SelectTrigger, { id: "language", className: "flex items-center gap-2", children: [_jsx(Globe, { className: "h-4 w-4" }), _jsx(SelectValue, { placeholder: t('settings.language') })] }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "ru", children: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439" }), _jsx(SelectItem, { value: "en", children: "English" })] })] })] }) })] })] }) }), _jsx(TabsContent, { value: "account", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: t('settings.account') }), _jsx(CardDescription, { children: t('settings.manageAccount') })] }), _jsx(CardContent, { className: "space-y-4", children: _jsx("p", { children: t('settings.accountSettings') }) })] }) }), _jsx(TabsContent, { value: "privacy", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: t('settings.privacy') }), _jsx(CardDescription, { children: t('settings.managePrivacy') })] }), _jsx(CardContent, { className: "space-y-4", children: _jsx("p", { children: t('settings.privacySettings') }) })] }) }), _jsx(TabsContent, { value: "notifications", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: t('settings.notifications') }), _jsx(CardDescription, { children: t('settings.manageNotifications') })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "email-notifications", children: t('settings.emailNotifications') }), _jsx("p", { className: "text-sm text-muted-foreground", children: t('settings.emailNotificationsDescription') })] }), _jsx(Switch, { id: "email-notifications", checked: emailNotifications, onCheckedChange: (checked) => handleNotificationChange('email', checked) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "push-notifications", children: t('settings.pushNotifications') }), _jsx("p", { className: "text-sm text-muted-foreground", children: t('settings.pushNotificationsDescription') })] }), _jsx(Switch, { id: "push-notifications", checked: pushNotifications, onCheckedChange: (checked) => handleNotificationChange('push', checked) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "desktop-notifications", children: t('settings.desktopNotifications') }), _jsx("p", { className: "text-sm text-muted-foreground", children: t('settings.desktopNotificationsDescription') })] }), _jsx(Switch, { id: "desktop-notifications", checked: desktopNotifications, onCheckedChange: (checked) => handleNotificationChange('desktop', checked) })] })] })] }) })] }), _jsxs("div", { className: "mt-8 flex justify-end", children: [_jsx(Button, { variant: "outline", className: "mr-2", children: t('common.cancel') }), _jsx(Button, { children: t('common.save') })] })] }));
};
export default SettingsPage;
