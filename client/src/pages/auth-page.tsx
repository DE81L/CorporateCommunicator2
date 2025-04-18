import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/language-switcher';
import {
  Tabs, TabsList, TabsTrigger, TabsContent
} from '@/components/ui/tabs';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent
} from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(1, "Username is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password too short"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const { user, login: loginFn, register: registerFn } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"login"|"register">("login");

  if (user) return <Redirect to="/" />;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex justify-end p-4">
        <LanguageSwitcher />
      </div>
      <Tabs defaultValue={activeTab} onValueChange={v => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
          <TabsTrigger value="register">{t('auth.register')}</TabsTrigger>
        </TabsList>

        {/* LOGIN */}
        <TabsContent value="login">
          <LoginForm />
        </TabsContent>

        {/* REGISTER */}
        <TabsContent value="register">
          <RegisterForm />
        </TabsContent>
      </Tabs>
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
      <Card className="mx-auto mt-6 w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('auth.loginTitle')}</CardTitle>
          <CardDescription>{t('auth.loginDescription')}</CardDescription>
        </CardHeader>
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
                control={form.control}
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
      </Card>
    );
  }

  // ───────────────────────────────────────────────────
  function RegisterForm() {
    const form = useForm<z.infer<typeof registerSchema>>({
      resolver: zodResolver(registerSchema),
    });

    const onSubmit = (data: z.infer<typeof registerSchema>) =>
      registerFn({
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });

    return (
      <Card className="mx-auto mt-6 w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('auth.register')}</CardTitle>
          <CardDescription>{t('auth.registerDescription')}</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
            <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.username')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('auth.enterUsername')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.firstName')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('auth.enterFirstName')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.lastName')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('auth.enterLastName')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.email')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('auth.enterEmail')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
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
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.confirmPassword')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={t('auth.enterConfirmPassword')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <Button type="submit" className="w-full">
                {t('auth.register')}
              </Button>
            </CardContent>
          </form>
        </Form>
      </Card>
    );
  }
}

