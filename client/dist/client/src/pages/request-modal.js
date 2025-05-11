import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription, } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { insertRequestSchema } from "@shared/schema";
import { createApiClient } from "@/lib/api-client";
export function RequestModal({ open, onOpenChange, onSuccess }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const apiClient = createApiClient();
    const { data: departments = [], isLoading: isDepartmentsLoading, error: departmentsError } = useQuery({
        queryKey: ["/api/departments"],
        queryFn: async () => {
            return await apiClient.request("/api/departments");
        },
        enabled: open
    });
    const [isError, setIsError] = useState(false);
    const taskOptions = [
        { id: 1, name: "Не работает принтер" },
        { id: 2, name: "Нет интернета" },
        { id: 3, name: "Не работает проектор" },
        { id: 4, name: "другое" },
    ];
    const form = useForm({
        resolver: zodResolver(insertRequestSchema),
        defaultValues: {
            receiverDepartmentId: 0,
            taskId: 0,
            cabinet: '',
            phone: '',
            isUrgent: false,
            comment: ''
        }
    });
    useEffect(() => {
        if (departments.length && form.getValues().receiverDepartmentId === undefined) {
            form.reset({ ...form.getValues(), receiverDepartmentId: departments[0].id });
        }
    }, [departments]);
    useEffect(() => {
        if (departmentsError) {
            setIsError(true);
            console.error("Failed to load departments", departmentsError);
        }
    }, [departmentsError]);
    const createRequest = useMutation({
        mutationFn: async (data) => {
            const payload = {
                ...data,
                creatorId: user?.id,
                numberOfRequest: crypto.randomUUID().slice(0, 8),
                requestStatus: "новая",
                grade: null,
            };
            const res = await apiClient.request("POST", "/api/requests", payload);
            return res;
        },
        onSuccess: () => {
            toast({ title: "Заявка создана" });
            queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
            onOpenChange(false);
            onSuccess();
        },
        onError: (err) => toast({
            title: "Не удалось создать заявку",
            description: err.message,
            variant: "destructive",
        }),
    });
    const isUrgent = form.watch("isUrgent");
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "\u041D\u043E\u0432\u0430\u044F \u0437\u0430\u044F\u0432\u043A\u0430" }) }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit((data) => createRequest.mutate(data)), className: "space-y-4", children: [_jsx(FormField, { control: form.control, name: "receiverDepartmentId", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "\u041F\u043E\u0434\u0440\u0430\u0437\u0434\u0435\u043B\u0435\u043D\u0438\u0435" }), isDepartmentsLoading ? (_jsx("div", { className: "flex justify-center items-center h-10", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) })) : isError ? (_jsx("div", { className: "text-center py-2 text-red-500", children: "Error loading departments. Please try again." })) : null, _jsxs(Select, { onValueChange: field.onChange, value: field.value?.toString(), children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u043E\u0434\u0440\u0430\u0437\u0434\u0435\u043B\u0435\u043D\u0438\u0435" }) }) }), _jsx(SelectContent, { children: departments.map((department) => (_jsx(SelectItem, { value: department.id.toString(), children: department.name }, department.id))) })] }), _jsx(FormDescription, { children: "\u041F\u043E\u0434\u0440\u0430\u0437\u0434\u0435\u043B\u0435\u043D\u0438\u0435, \u043A\u043E\u0442\u043E\u0440\u043E\u043C\u0443 \u043D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0430 \u0437\u0430\u044F\u0432\u043A\u0430." }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "taskId", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "\u0417\u0430\u0434\u0430\u0447\u0430" }), _jsxs(Select, { onValueChange: (val) => field.onChange(+val), children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0437\u0430\u0434\u0430\u0447\u0443" }) }) }), _jsx(SelectContent, { children: taskOptions.map((t) => (_jsx(SelectItem, { value: t.id.toString(), children: t.name }, t.id))) })] })] })) }), _jsx(FormField, { control: form.control, name: "cabinet", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "\u041A\u0430\u0431\u0438\u043D\u0435\u0442 (\u043E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E)" }), _jsx(FormControl, { children: _jsx(Input, { ...field, placeholder: "301-\u0410" }) })] })) }), _jsx(FormField, { control: form.control, name: "phone", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "\u041D\u043E\u043C\u0435\u0440 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430" }), _jsx(FormControl, { children: _jsx(Input, { ...field, placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043D\u043E\u043C\u0435\u0440 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430" }) })] })) }), _jsx(FormField, { control: form.control, name: "isUrgent", render: ({ field }) => (_jsxs(FormItem, { className: "flex items-center gap-2", children: [_jsx(FormControl, { children: _jsx(Checkbox, { checked: field.value, onCheckedChange: field.onChange }) }), _jsx(FormLabel, { children: "\u0421\u0440\u043E\u0447\u043D\u0430\u044F \u0437\u0430\u044F\u0432\u043A\u0430" })] })) }), isUrgent && (_jsx(FormField, { control: form.control, name: "deadline", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "\u0414\u0435\u0434\u043B\u0430\u0439\u043D" }), _jsx(FormControl, { children: _jsx(DateTimePicker, { ...field, value: field.value ? new Date(field.value) : undefined }) })] })) })), _jsx(FormField, { control: form.control, name: "comment", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "\u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "\u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439", ...field }) })] })) }), _jsx(DialogFooter, { children: _jsx(Button, { type: "submit", disabled: createRequest.isPending, className: "ml-auto", children: createRequest.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435..."] })) : (_jsxs(_Fragment, { children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "\u0421\u043E\u0437\u0434\u0430\u0442\u044C"] })) }) })] }) })] }) }));
}
export default RequestModal;
