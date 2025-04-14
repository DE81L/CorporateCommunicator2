import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../hooks/use-auth";
import i18n from "../i18n";
import { useCallback, useState } from "react";
import { z } from "zod";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
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
import { useTranslation } from "react-i18next";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(1, "Username is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, { 
  message: "Passwords do not match",
    path: ["confirmPassword"],
});

export default function AuthPage() { 
  const { user, login: loginFn, register } = useAuth();
  
  const login = useCallback(async (data: z.infer<typeof loginSchema>) => {
      if (user) {
        console.log('User is already logged in. Skipping login attempt.');
        return;
      }
      await loginFn({username: data.username, password: data.password});
    }
, [loginFn, user]);

  const registerFn = async (data: z.infer<typeof registerSchema>) => {
    await register(data);
  };
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col">
        <div className="flex justify-end p-4">
            <LanguageSwitcher />
        </div>
      <Tabs defaultValue={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
        <TabsList>
          <TabsTrigger value="login">{i18n.t('auth.login')}</TabsTrigger>
          <TabsTrigger value="register">{i18n.t('auth.register')}</TabsTrigger>
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
        <CardTitle>{i18n.t('auth.loginTitle')}</CardTitle>
        <CardDescription>{i18n.t('auth.loginDescription')}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
                    name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{i18n.t('auth.usernameOrEmail')}</FormLabel>
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
                  <FormLabel>{i18n.t('auth.password')}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                                            placeholder={i18n.t('auth.enterPassword')}
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
                  {i18n.t('auth.rememberMe')}
                </label>
              </div>
              <Button variant="link" className="px-0">
                {i18n.t('auth.forgotPassword')}
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
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{i18n.t('auth.registerTitle')}</CardTitle>
        <CardDescription>{i18n.t('auth.registerDescription')}</CardDescription>
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
                    <Input type="email" placeholder={t('auth.enterEmail')} {...field} />
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
                    <Input type="password" placeholder={t('auth.confirmPassword')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          
          
          <CardFooter className="flex justify-end">
            <Button type="submit">
                            {i18n.t('auth.register')}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
