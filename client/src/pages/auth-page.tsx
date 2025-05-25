import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next'; 
import { LanguageSwitcher } from '@/components/language-switcher';

import { Card, CardHeader, CardTitle, CardDescription, CardContent
} from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function AuthPage() {
  const { user, login: loginFn } = useAuth();
  const { t } = useTranslation();

  if (user) return <Redirect to="/" />;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900 dark:to-gray-800">
      <div className="flex justify-end p-4">
        <LanguageSwitcher />
      </div>
      <div className="flex justify-center bg-primary-50 dark:bg-primary-800/40 py-4 border-b w-full">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  );

  // ───────────────────────────────────────────────────
  function LoginForm() {
    const form = useForm<z.infer<typeof loginSchema>>({
      resolver: zodResolver(loginSchema),
    });

    const onSubmit = (data: z.infer<typeof loginSchema>) =>
      loginFn({ username: data.username, password: data.password });

    return (
      <Card className='p-4 bg-background/80 backdrop-blur'>
        <CardHeader>
          <CardTitle>{t('auth.loginTitle')}</CardTitle>
          <CardDescription>{t('auth.loginDescription')}</CardDescription>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.usernameOrEmail')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('auth.enterUsernameOrEmail')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.password')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={t('auth.enterPassword')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                {t('auth.loginButton')}
              </Button>
            </CardContent>
          </form>
        </Form>  
        </CardHeader>
      </Card>
    );
  }

  // ───────────────────────────────────────────────────
}

