import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next'; 
import { LanguageSwitcher } from '@/components/language-switcher';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent
} from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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
  const { user, login: loginFn } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"login"|"register">("login");

  if (user) return <Redirect to="/" />;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex justify-end p-4">
        <LanguageSwitcher />
      </div>
      <div className="flex justify-center bg-gray-50 py-4 border-b w-full">
        <div className='w-full max-w-md'>
          <Tabs defaultValue={activeTab} onValueChange={v => setActiveTab(v as any)} className='w-full'>
              <Card>
              <TabsList className="space-x-4 bg-white w-full flex">
                <TabsTrigger value="login" className='text-gray-500 hover:text-gray-900 bg-white data-[state=active]:bg-white data-[state=active]:text-black flex-1'>{t('auth.login')}</TabsTrigger>
                <TabsTrigger value="register" className='text-gray-500 hover:text-gray-900 bg-white data-[state=active]:bg-white data-[state=active]:text-black flex-1'>{t('auth.register')}</TabsTrigger>
              </TabsList>
                
              <CardContent className='p-0'>
                  {/* LOGIN */}
                  <TabsContent value="login">
                    <LoginForm />
                  </TabsContent>
                  {/* REGISTER */}
                  <TabsContent value="register">
                    <RegisterForm />
                  </TabsContent>
              </CardContent>
              </Card>
            </Tabs>
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
      <Card className='p-4'>
        <CardHeader>
          <CardTitle>{t('auth.loginTitle')}</CardTitle>
          <CardDescription>{t('auth.loginDescription')}</CardDescription>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
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
  function RegisterForm() {
    const form = useForm<z.infer<typeof registerSchema>>({
      resolver: zodResolver(registerSchema)
    });
    const { toast } = useToast();
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const registerMutation = useMutation({
      mutationFn: async (data: z.infer<typeof registerSchema>) => {
        const res = await fetch(`${baseURL}/api/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Registration failed');
        }
        return await res.json();
      },
      onSuccess: () => {
        console.log('Registration successful!');
      },
      onError: (error: Error) => {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: error.message
        })
      },
    })

    const onSubmit = (data: z.infer<typeof registerSchema>) => {
      const { confirmPassword, ...payload } = data; // ← dot-dot-dot
      registerMutation.mutate(payload);
    }

    return (
      <Form {...form}>
        <Card className='p-4'>
        <CardHeader>
          <CardTitle>{t('auth.register')}</CardTitle>
          <CardDescription>{t('auth.registerDescription')}</CardDescription>
         </CardHeader>
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
        </Card>
      </Form>

    );
  }
}

