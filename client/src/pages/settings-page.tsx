import React from 'react';
import { useTranslations } from '@/hooks/use-translations';
import { useSettings } from '@/context/SettingsContext';
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
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '@/lib/api-client';
import { Bell, Moon, Sun, Globe, User, Lock, Settings as SettingsIcon, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

const SettingsPage: React.FC = () => {
  const { t } = useTranslations();
  const { theme, setTheme, language, setLanguage } = useSettings();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const apiClient = createApiClient();
  const [, setLocation] = useLocation();
  const [pushNotifications, setPushNotifications] = React.useState(true);
  const [desktopNotifications, setDesktopNotifications] = React.useState(true);

  const { data: jobs = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['/api/jobs'],
    queryFn: async () =>
      (await apiClient.request<{ id: number; name: string }[]>('/api/jobs')) ?? [],
  });

  const updateJob = useMutation({
    mutationFn: async (jobId: number | null) => {
      await apiClient.request('/api/user/job', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
    },
    onSuccess: (_data, jobId) => {
      queryClient.setQueryData(['/api/user'], (prev: any) =>
        prev ? { ...prev, jobId, jobTitle: jobs.find(j => j.id === jobId)?.name ?? null } : prev
      );
      toast({ title: t('common.changesApplied') });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: error.message });
    },
  });

  const handleThemeChange = (value: 'light' | 'dark' | 'system') => {
    setTheme(value);
    
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
    type: 'push' | 'desktop',
    value: boolean
  ) => {
    switch (type) {
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

  const changePasswordSchema = z
    .object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z.string().min(6, 'Password too short'),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    });

  function ChangePasswordForm() {
    const form = useForm<z.infer<typeof changePasswordSchema>>({
      resolver: zodResolver(changePasswordSchema),
    });

    const mutation = useMutation({
      mutationFn: async (data: z.infer<typeof changePasswordSchema>) => {
        const { confirmPassword, ...payload } = data;
        await apiClient.request('/api/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPassword: payload.currentPassword,
            newPassword: payload.newPassword,
          }),
        });
      },
      onSuccess: () => {
        toast({ title: t('common.changesApplied') });
        form.reset();
      },
      onError: (error: Error) => {
        toast({ variant: 'destructive', title: error.message });
      },
    });

    const onSubmit = (data: z.infer<typeof changePasswordSchema>) => {
      mutation.mutate(data);
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('profile.currentPassword')}</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('profile.newPassword')}</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.confirmPassword')}</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={mutation.isPending}>
            {t('profile.changePassword')}
          </Button>
        </form>
      </Form>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/') }>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
        </div>
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
                    onValueChange={setLanguage}
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
              <div className="space-y-2">
                <Label htmlFor="position">{t('profile.position')}</Label>
                <Select
                  value={user?.jobId ? String(user.jobId) : 'none'}
                  onValueChange={(val) =>
                    updateJob.mutate(val === 'none' ? null : Number(val))
                  }
                >
                  <SelectTrigger id="position">
                    <SelectValue placeholder={t('profile.selectPosition')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-</SelectItem>
                    {jobs.map((j) => (
                      <SelectItem key={j.id} value={String(j.id)}>{j.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ChangePasswordForm />
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
        <Button variant="outline" className="mr-2" onClick={() => setLocation('/') }>
          {t('common.back')}
        </Button>
        <Button>
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
