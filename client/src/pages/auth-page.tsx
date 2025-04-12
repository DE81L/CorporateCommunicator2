import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../hooks/use-auth"; // Import useAuth from hooks
import { useState } from "react";
import { z } from "zod";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useTranslation } from 'react-i18next';

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({ 
    username: z.string().min(1, "Username is required"),
});

export default function AuthPage() { 
  const { t } = useTranslation();
  const { user, login: loginFn, register } = useAuth();
  
  const login = async (data: z.infer<typeof loginSchema>) => {
    await loginFn({username: data.username, password: data.password});
  };

  const registerFn = async (data: z.infer<typeof registerSchema>) => {
    await register({username: data.username});
  };
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex">
      <Tabs defaultValue={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
        <TabsList>
          <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
          <TabsTrigger value="register">{t('auth.register')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
          <LoginForm onSubmit={login} />
        </TabsContent>
        
        <TabsContent value="register">
          <RegisterForm onSubmit={registerFn} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LoginForm({
  onSubmit,
}: {
  onSubmit: (data: z.infer<typeof loginSchema>) => void;
}) {
  const { t } = useTranslation();
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  return (
    <Card>
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
                    <Input
                      placeholder={t('auth.enterUsernameOrEmail')}
                      {...field}
                    />
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
                    <Input
                      type="password"
                      placeholder={t('auth.enterPassword')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember-me"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="remember-me" className="text-sm text-gray-600">
                  {t('auth.rememberMe')}
                </label>
              </div>
              <Button variant="link" className="px-0">
                {t('auth.forgotPassword')}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit">
              {t('auth.login')}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

function RegisterForm({
  onSubmit,
}: {
  onSubmit: (data: z.infer<typeof registerSchema>) => void;
}) {
  const { t } = useTranslation();
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
    },
  });

  return (<Card>
      <CardHeader>
        <CardTitle>{t('auth.registerTitle')}</CardTitle>
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
                    <Input placeholder="Enter your username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
          </CardContent>
          
          
          
          
          <CardFooter className="flex justify-end">
            <Button type="submit">
              {t('auth.register')}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
