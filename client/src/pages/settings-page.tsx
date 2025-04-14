import React from 'react';
import { useTranslations } from '@/lib/i18n/translations.ts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Bell, Moon, Sun, Globe, User, Lock, Settings as SettingsIcon } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { t, language, setLanguage } = useTranslations();
  const { toast } = useToast();
  const [theme, setTheme] = React.useState<'light' | 'dark' | 'system'>('system');
  const [emailNotifications, setEmailNotifications] = React.useState(true);
  const [pushNotifications, setPushNotifications] = React.useState(true);
  const [desktopNotifications, setDesktopNotifications] = React.useState(true);

  const handleLanguageChange = (value: string) => {
    setLanguage(value as 'ru' | 'en');
    toast({
      title: t('settings.changesApplied'),
      description: t('settings.language') + ': ' + (value === 'ru' ? 'Русский' : 'English'),
      duration: 2000,
    });
  };

  const handleThemeChange = (value: 'light' | 'dark' | 'system') => {
    setTheme(value);
    // Apply theme change logic here
    document.documentElement.classList.remove('light', 'dark');
    if (value === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      document.documentElement.classList.add(systemTheme);
    } else {
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

  const handleNotificationChange = (
    type: 'email' | 'push' | 'desktop',
    value: boolean
  ) => {
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

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
        <SettingsIcon className="h-6 w-6" />
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            <span>{t('settings.general')}</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{t('settings.account')}</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span>{t('settings.privacy')}</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>{t('settings.notifications')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.appearance')}</CardTitle>
                <CardDescription>
                  {t('settings.customizeAppearance')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">{t('settings.theme')}</Label>
                  <Select
                    value={theme}
                    onValueChange={(value) => handleThemeChange(value as 'light' | 'dark' | 'system')}
                  >
                    <SelectTrigger id="theme">
                      <SelectValue placeholder={t('settings.theme')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light" className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          <span>{t('settings.lightMode')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="dark" className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          <span>{t('settings.darkMode')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('settings.language')}</CardTitle>
                <CardDescription>
                  {t('settings.changeLanguage')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">{t('settings.language')}</Label>
                  <Select
                    value={language}
                    onValueChange={handleLanguageChange}
                  >
                    <SelectTrigger id="language" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <SelectValue placeholder={t('settings.language')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ru">Русский</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.account')}</CardTitle>
              <CardDescription>
                {t('settings.manageAccount')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{t('settings.accountSettings')}</p>
              {/* Account settings will be implemented here */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.privacy')}</CardTitle>
              <CardDescription>
                {t('settings.managePrivacy')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{t('settings.privacySettings')}</p>
              {/* Privacy settings will be implemented here */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.notifications')}</CardTitle>
              <CardDescription>
                {t('settings.manageNotifications')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="email-notifications">
                    {t('settings.emailNotifications')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.emailNotificationsDescription')}
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="push-notifications">
                    {t('settings.pushNotifications')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.pushNotificationsDescription')}
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={pushNotifications}
                  onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="desktop-notifications">
                    {t('settings.desktopNotifications')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.desktopNotificationsDescription')}
                  </p>
                </div>
                <Switch
                  id="desktop-notifications"
                  checked={desktopNotifications}
                  onCheckedChange={(checked) => handleNotificationChange('desktop', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex justify-end">
        <Button variant="outline" className="mr-2">
          {t('common.cancel')}
        </Button>
        <Button>
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;