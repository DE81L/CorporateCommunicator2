"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AuthPage;
const react_1 = __importStar(require("react"));
const react_hook_form_1 = require("react-hook-form");
const react_query_1 = require("@tanstack/react-query");
const zod_1 = require("zod");
const zod_2 = require("@hookform/resolvers/zod");
const wouter_1 = require("wouter");
const use_auth_1 = require("@/hooks/use-auth");
const react_i18next_1 = require("react-i18next");
const language_switcher_1 = require("@/components/language-switcher");
const tabs_1 = require("@/components/ui/tabs");
const card_1 = require("@/components/ui/card");
const form_1 = require("@/components/ui/form");
const input_1 = require("@/components/ui/input");
const button_1 = require("@/components/ui/button");
const use_toast_1 = require("@/hooks/use-toast");
const loginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, "Username is required"),
    password: zod_1.z.string().min(1, "Password is required"),
});
const registerSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, "Username is required"),
    firstName: zod_1.z.string().min(1, "First name is required"), // Already camelCase
    lastName: zod_1.z.string().min(1, "Last name is required"), // Already camelCase
    email: zod_1.z.string().email("Invalid email"),
    password: zod_1.z.string().min(6, "Password too short"),
    confirmPassword: zod_1.z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
});
function AuthPage() {
    const { user, login: loginFn } = (0, use_auth_1.useAuth)();
    const { t } = (0, react_i18next_1.useTranslation)();
    const [activeTab, setActiveTab] = (0, react_1.useState)("login");
    if (user)
        return <wouter_1.Redirect to="/"/>;
    return (<div className="min-h-screen flex flex-col">
      <div className="flex justify-end p-4">
        <language_switcher_1.LanguageSwitcher />
      </div>
      <div className="flex justify-center bg-gray-50 py-4 border-b w-full">
        <div className='w-full max-w-md'>
          <tabs_1.Tabs defaultValue={activeTab} onValueChange={(v) => setActiveTab(v)} className="w-full">
              <card_1.Card>
              <tabs_1.TabsList className="space-x-4 bg-white w-full flex">
                <tabs_1.TabsTrigger value="login" className='text-gray-500 hover:text-gray-900 bg-white data-[state=active]:bg-white data-[state=active]:text-black flex-1'>{t('auth.login')}</tabs_1.TabsTrigger>
                <tabs_1.TabsTrigger value="register" className='text-gray-500 hover:text-gray-900 bg-white data-[state=active]:bg-white data-[state=active]:text-black flex-1'>{t('auth.register')}</tabs_1.TabsTrigger>
              </tabs_1.TabsList>
                
              <card_1.CardContent className='p-0'>
                  {/* LOGIN */}
                  <tabs_1.TabsContent value="login">
                    <LoginForm />
                  </tabs_1.TabsContent>
                  {/* REGISTER */}
                  <tabs_1.TabsContent value="register">
                    <RegisterForm />
                  </tabs_1.TabsContent>
              </card_1.CardContent>
              </card_1.Card>
            </tabs_1.Tabs>
        </div>
      </div>
    </div>);
    // ───────────────────────────────────────────────────
    function LoginForm() {
        const form = (0, react_hook_form_1.useForm)({
            resolver: (0, zod_2.zodResolver)(loginSchema),
        });
        const onSubmit = (data) => loginFn({ username: data.username, password: data.password });
        return (<card_1.Card className='p-4'>
        <card_1.CardHeader>
          <card_1.CardTitle>{t('auth.loginTitle')}</card_1.CardTitle>
          <card_1.CardDescription>{t('auth.loginDescription')}</card_1.CardDescription>
        <form_1.Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <card_1.CardContent className="space-y-4">
              <form_1.FormField name="username" render={({ field }) => (<form_1.FormItem>
                    <form_1.FormLabel>{t('auth.usernameOrEmail')}</form_1.FormLabel>
                    <form_1.FormControl>
                      <input_1.Input placeholder={t('auth.enterUsernameOrEmail')} {...field}/>
                    </form_1.FormControl>
                    <form_1.FormMessage />
                  </form_1.FormItem>)}/>
              <form_1.FormField name="password" render={({ field }) => (<form_1.FormItem>
                    <form_1.FormLabel>{t('auth.password')}</form_1.FormLabel>
                    <form_1.FormControl>
                      <input_1.Input type="password" placeholder={t('auth.enterPassword')} {...field}/>
                    </form_1.FormControl>
                    <form_1.FormMessage />
                  </form_1.FormItem>)}/>

              <button_1.Button type="submit" className="w-full">
                {t('auth.loginButton')}
              </button_1.Button>
            </card_1.CardContent>
          </form>
        </form_1.Form>  
        </card_1.CardHeader>
      </card_1.Card>);
    }
    // ───────────────────────────────────────────────────
    function RegisterForm() {
        const form = (0, react_hook_form_1.useForm)({
            resolver: (0, zod_2.zodResolver)(registerSchema)
        });
        const { toast } = (0, use_toast_1.useToast)();
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const registerMutation = (0, react_query_1.useMutation)({
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
        return (<form_1.Form {...form}>
        <card_1.Card className='p-4'>
        <card_1.CardHeader>
          <card_1.CardTitle>{t('auth.register')}</card_1.CardTitle>
          <card_1.CardDescription>{t('auth.registerDescription')}</card_1.CardDescription>
         </card_1.CardHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <card_1.CardContent className="space-y-4">
            <form_1.FormField control={form.control} name="username" render={({ field }) => (<form_1.FormItem>
                    <form_1.FormLabel>{t('auth.username')}</form_1.FormLabel>
                    <form_1.FormControl>
                      <input_1.Input placeholder={t('auth.enterUsername')} {...field}/>
                    </form_1.FormControl>
                    <form_1.FormMessage />
                  </form_1.FormItem>)}/>
              <form_1.FormField name="firstName" render={({ field }) => (<form_1.FormItem>
                    <form_1.FormLabel>{t('auth.firstName')}</form_1.FormLabel>
                    <form_1.FormControl>
                      <input_1.Input placeholder={t('auth.enterFirstName')} {...field}/>
                    </form_1.FormControl>
                    <form_1.FormMessage />
                  </form_1.FormItem>)}/>
              <form_1.FormField name="lastName" render={({ field }) => (<form_1.FormItem>
                    <form_1.FormLabel>{t('auth.lastName')}</form_1.FormLabel>
                    <form_1.FormControl>
                      <input_1.Input placeholder={t('auth.enterLastName')} {...field}/>
                    </form_1.FormControl>
                    <form_1.FormMessage />
                  </form_1.FormItem>)}/>
              <form_1.FormField name="email" render={({ field }) => (<form_1.FormItem>
                    <form_1.FormLabel>{t('auth.email')}</form_1.FormLabel>
                    <form_1.FormControl>
                      <input_1.Input placeholder={t('auth.enterEmail')} {...field}/>
                    </form_1.FormControl>
                    <form_1.FormMessage />
                  </form_1.FormItem>)}/>
              <form_1.FormField name="password" render={({ field }) => (<form_1.FormItem>
                    <form_1.FormLabel>{t('auth.password')}</form_1.FormLabel>
                    <form_1.FormControl>
                      <input_1.Input type="password" placeholder={t('auth.enterPassword')} {...field}/>
                    </form_1.FormControl>
                    <form_1.FormMessage />
                  </form_1.FormItem>)}/>
              <form_1.FormField name="confirmPassword" render={({ field }) => (<form_1.FormItem>
                    <form_1.FormLabel>{t('auth.confirmPassword')}</form_1.FormLabel>
                    <form_1.FormControl>
                      <input_1.Input type="password" placeholder={t('auth.enterConfirmPassword')} {...field}/>
                    </form_1.FormControl>
                    <form_1.FormMessage />
                  </form_1.FormItem>)}/>
            <button_1.Button type="submit" className="w-full">
                {t('auth.register')}
              </button_1.Button>
            </card_1.CardContent>
          </form>
        </card_1.Card>
      </form_1.Form>);
    }
}
