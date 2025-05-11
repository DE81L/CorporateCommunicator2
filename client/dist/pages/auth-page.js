import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
    firstName: z.string().min(1, "First name is required"), // Already camelCase
    lastName: z.string().min(1, "Last name is required"), // Already camelCase
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
    const [activeTab, setActiveTab] = useState("login");
    if (user)
        return _jsx(Redirect, { to: "/" });
    return (_jsxs("div", { className: "min-h-screen flex flex-col", children: [_jsx("div", { className: "flex justify-end p-4", children: _jsx(LanguageSwitcher, {}) }), _jsx("div", { className: "flex justify-center bg-gray-50 py-4 border-b w-full", children: _jsx("div", { className: 'w-full max-w-md', children: _jsx(Tabs, { defaultValue: activeTab, onValueChange: (v) => setActiveTab(v), className: "w-full", children: _jsxs(Card, { children: [_jsxs(TabsList, { className: "space-x-4 bg-white w-full flex", children: [_jsx(TabsTrigger, { value: "login", className: 'text-gray-500 hover:text-gray-900 bg-white data-[state=active]:bg-white data-[state=active]:text-black flex-1', children: t('auth.login') }), _jsx(TabsTrigger, { value: "register", className: 'text-gray-500 hover:text-gray-900 bg-white data-[state=active]:bg-white data-[state=active]:text-black flex-1', children: t('auth.register') })] }), _jsxs(CardContent, { className: 'p-0', children: [_jsx(TabsContent, { value: "login", children: _jsx(LoginForm, {}) }), _jsx(TabsContent, { value: "register", children: _jsx(RegisterForm, {}) })] })] }) }) }) })] }));
    // ───────────────────────────────────────────────────
    function LoginForm() {
        const form = useForm({
            resolver: zodResolver(loginSchema),
        });
        const onSubmit = (data) => loginFn({ username: data.username, password: data.password });
        return (_jsx(Card, { className: 'p-4', children: _jsxs(CardHeader, { children: [_jsx(CardTitle, { children: t('auth.loginTitle') }), _jsx(CardDescription, { children: t('auth.loginDescription') }), _jsx(Form, { ...form, children: _jsx("form", { onSubmit: form.handleSubmit(onSubmit), children: _jsxs(CardContent, { className: "space-y-4", children: [_jsx(FormField, { name: "username", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: t('auth.usernameOrEmail') }), _jsx(FormControl, { children: _jsx(Input, { placeholder: t('auth.enterUsernameOrEmail'), ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { name: "password", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: t('auth.password') }), _jsx(FormControl, { children: _jsx(Input, { type: "password", placeholder: t('auth.enterPassword'), ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(Button, { type: "submit", className: "w-full", children: t('auth.loginButton') })] }) }) })] }) }));
    }
    // ───────────────────────────────────────────────────
    function RegisterForm() {
        const form = useForm({
            resolver: zodResolver(registerSchema)
        });
        const { toast } = useToast();
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const registerMutation = useMutation({
            mutationFn: async (data) => {
                const { confirmPassword, ...payload } = data;
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                });
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || 'Registration failed');
                }
                return await res.json();
            },
            onSuccess: () => {
                toast({ title: "Registration successful!" });
                setActiveTab("login"); // switch to login tab after registration
            },
            onError: (error) => {
                toast({
                    variant: "destructive",
                    title: "Registration failed",
                    description: error.message
                });
            },
        });
        const onSubmit = (data) => {
            registerMutation.mutate(data);
        };
        return (_jsx(Form, { ...form, children: _jsxs(Card, { className: 'p-4', children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: t('auth.register') }), _jsx(CardDescription, { children: t('auth.registerDescription') })] }), _jsx("form", { onSubmit: form.handleSubmit(onSubmit), children: _jsxs(CardContent, { className: "space-y-4", children: [_jsx(FormField, { control: form.control, name: "username", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: t('auth.username') }), _jsx(FormControl, { children: _jsx(Input, { placeholder: t('auth.enterUsername'), ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { name: "firstName", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: t('auth.firstName') }), _jsx(FormControl, { children: _jsx(Input, { placeholder: t('auth.enterFirstName'), ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { name: "lastName", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: t('auth.lastName') }), _jsx(FormControl, { children: _jsx(Input, { placeholder: t('auth.enterLastName'), ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { name: "email", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: t('auth.email') }), _jsx(FormControl, { children: _jsx(Input, { placeholder: t('auth.enterEmail'), ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { name: "password", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: t('auth.password') }), _jsx(FormControl, { children: _jsx(Input, { type: "password", placeholder: t('auth.enterPassword'), ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { name: "confirmPassword", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: t('auth.confirmPassword') }), _jsx(FormControl, { children: _jsx(Input, { type: "password", placeholder: t('auth.enterConfirmPassword'), ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(Button, { type: "submit", className: "w-full", children: t('auth.register') })] }) })] }) }));
    }
}
