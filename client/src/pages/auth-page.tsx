 import React from 'react';
 import { useForm } from 'react-hook-form';
 import { useAuth, LoginCredentials } from '@/hooks/use-auth';
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { useTranslations } from '@/hooks/use-translations';
 
 export default function AuthPage() {
   const { login, isLoggingIn } = useAuth(); // Получаем login и статус isLoggingIn // 2. Получаем функцию navigate
   const { t } = useTranslations();
 
   const { register, handleSubmit, formState: { errors } } = useForm<LoginCredentials>({
       defaultValues: {
           username: '',
           password: '',
       }
   });
 
   const onSubmit = async (data: LoginCredentials) => {
     console.log("Form submitted with data:", data);
     try {
       // Вызываем login из useAuth (который теперь использует хардкодную мутацию)
       await login(data);
 
       // 3. Если login выполнился успешно (т.е. промис разрешился без ошибки)
       console.log('Hardcoded login successful in AuthPage, navigating to /');
 
       // --- ВЫПОЛНЯЕМ НАВИГАЦИЮ ---
       // Перенаправляем на главную страницу
       // ---------------------------
 
     } catch (error) {
       // Ошибка уже обработана и показана через toast в onError мутации (use-auth.tsx)
       // Можно добавить дополнительное логирование здесь, если нужно
       console.error("Login attempt caught error in AuthPage:", error);
     }
   };
 
   return (
     <div className="flex items-center justify-center min-h-screen bg-background">
       <Card className="w-full max-w-sm">
         <CardHeader>
           <CardTitle className="text-2xl">{t('auth.loginTitle')}</CardTitle>
           <CardDescription>
             {t('auth.loginDescription')}
           </CardDescription>
         </CardHeader>
         <CardContent>
           <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
             <div className="space-y-2">
               <Label htmlFor="username">{t('auth.usernameOrEmail')}</Label>
               <Input
                 id="username"
                 type="text"
                 placeholder={t('auth.usernameOrEmailPlaceholder')}
                 {...register("username", { required: t('validation.requiredField') })}
                 aria-invalid={errors.username ? "true" : "false"}
               />
               {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
             </div>
             <div className="space-y-2">
               <Label htmlFor="password">{t('auth.password')}</Label>
               <Input
                 id="password"
                 type="password"
                 placeholder="********"
                 {...register("password", { required: t('validation.requiredField') })}
                 aria-invalid={errors.password ? "true" : "false"}
               />
               {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
             </div>
             <Button type="submit" className="w-full" disabled={isLoggingIn}>
               {isLoggingIn ? t('auth.loggingIn') : t('auth.loginButton')}
             </Button>
           </form>
           {/* Можно добавить ссылку на регистрацию или восстановление пароля */}
           {/* <div className="mt-4 text-center text-sm">
             Don't have an account?{' '}
             <a href="#" className="underline">
               Sign up
             </a>
           </div> */}
         </CardContent>
       </Card>
     </div>
   );
 }
