"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const use_translations_1 = require("@/hooks/use-translations");
const card_1 = require("@/components/ui/card");
const tabs_1 = require("@/components/ui/tabs");
const select_1 = require("@/components/ui/select");
const switch_1 = require("@/components/ui/switch");
const label_1 = require("@/components/ui/label");
const use_toast_1 = require("@/hooks/use-toast");
const button_1 = require("@/components/ui/button");
const lucide_react_1 = require("lucide-react");
const SettingsPage = () => {
    const { t, currentLanguage, changeLanguage } = (0, use_translations_1.useTranslations)();
    const { toast } = (0, use_toast_1.useToast)();
    const [theme, setTheme] = react_1.default.useState('system');
    const [emailNotifications, setEmailNotifications] = react_1.default.useState(true);
    const [pushNotifications, setPushNotifications] = react_1.default.useState(true);
    const [desktopNotifications, setDesktopNotifications] = react_1.default.useState(true);
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
    return (<div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
        <lucide_react_1.Settings className="h-6 w-6"/>
      </div>

      <tabs_1.Tabs defaultValue="general" className="w-full">
        <tabs_1.TabsList className="grid grid-cols-4 mb-8">
          <tabs_1.TabsTrigger value="general" className="flex items-center gap-2">
            <lucide_react_1.Settings className="h-4 w-4"/>
            <span>{t('settings.general')}</span>
          </tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="account" className="flex items-center gap-2">
            <lucide_react_1.User className="h-4 w-4"/>
            <span>{t('settings.account')}</span>
          </tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="privacy" className="flex items-center gap-2">
            <lucide_react_1.Lock className="h-4 w-4"/>
            <span>{t('settings.privacy')}</span>
          </tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="notifications" className="flex items-center gap-2">
            <lucide_react_1.Bell className="h-4 w-4"/>
            <span>{t('settings.notifications')}</span>
          </tabs_1.TabsTrigger>
        </tabs_1.TabsList>

        <tabs_1.TabsContent value="general">
          <div className="grid gap-6">
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>{t('settings.appearance')}</card_1.CardTitle>
                <card_1.CardDescription>
                  {t('settings.customizeAppearance')}
                </card_1.CardDescription>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-4">
                <div className="space-y-2">
                  <label_1.Label htmlFor="theme">{t('settings.theme')}</label_1.Label>
                  <select_1.Select value={theme} onValueChange={(value) => handleThemeChange(value)}>
                    <select_1.SelectTrigger id="theme">
                      <select_1.SelectValue placeholder={t('settings.theme')}/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="light" className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <lucide_react_1.Sun className="h-4 w-4"/>
                          <span>{t('settings.lightMode')}</span>
                        </div>
                      </select_1.SelectItem>
                      <select_1.SelectItem value="dark" className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <lucide_react_1.Moon className="h-4 w-4"/>
                          <span>{t('settings.darkMode')}</span>
                        </div>
                      </select_1.SelectItem>
                      <select_1.SelectItem value="system">System</select_1.SelectItem>
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>{t('settings.language')}</card_1.CardTitle>
                <card_1.CardDescription>
                  {t('settings.changeLanguage')}
                </card_1.CardDescription>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-4">
                <div className="space-y-2">
                  <label_1.Label htmlFor="language">{t('settings.language')}</label_1.Label>
                  <select_1.Select value={currentLanguage} onValueChange={changeLanguage}>
                    <select_1.SelectTrigger id="language" className="flex items-center gap-2">
                      <lucide_react_1.Globe className="h-4 w-4"/>
                      <select_1.SelectValue placeholder={t('settings.language')}/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="ru">Русский</select_1.SelectItem>
                      <select_1.SelectItem value="en">English</select_1.SelectItem>
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </div>
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="account">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>{t('settings.account')}</card_1.CardTitle>
              <card_1.CardDescription>
                {t('settings.manageAccount')}
              </card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-4">
              <p>{t('settings.accountSettings')}</p>
              {/* Account settings will be implemented here */}
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="privacy">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>{t('settings.privacy')}</card_1.CardTitle>
              <card_1.CardDescription>
                {t('settings.managePrivacy')}
              </card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-4">
              <p>{t('settings.privacySettings')}</p>
              {/* Privacy settings will be implemented here */}
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="notifications">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>{t('settings.notifications')}</card_1.CardTitle>
              <card_1.CardDescription>
                {t('settings.manageNotifications')}
              </card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label_1.Label htmlFor="email-notifications">
                    {t('settings.emailNotifications')}
                  </label_1.Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.emailNotificationsDescription')}
                  </p>
                </div>
                <switch_1.Switch id="email-notifications" checked={emailNotifications} onCheckedChange={(checked) => handleNotificationChange('email', checked)}/>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label_1.Label htmlFor="push-notifications">
                    {t('settings.pushNotifications')}
                  </label_1.Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.pushNotificationsDescription')}
                  </p>
                </div>
                <switch_1.Switch id="push-notifications" checked={pushNotifications} onCheckedChange={(checked) => handleNotificationChange('push', checked)}/>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label_1.Label htmlFor="desktop-notifications">
                    {t('settings.desktopNotifications')}
                  </label_1.Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.desktopNotificationsDescription')}
                  </p>
                </div>
                <switch_1.Switch id="desktop-notifications" checked={desktopNotifications} onCheckedChange={(checked) => handleNotificationChange('desktop', checked)}/>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>
      </tabs_1.Tabs>

      <div className="mt-8 flex justify-end">
        <button_1.Button variant="outline" className="mr-2">
          {t('common.cancel')}
        </button_1.Button>
        <button_1.Button>
          {t('common.save')}
        </button_1.Button>
      </div>
    </div>);
};
exports.default = SettingsPage;
