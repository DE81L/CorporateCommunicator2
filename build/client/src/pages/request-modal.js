"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestModal = RequestModal;
const react_1 = __importDefault(require("react"));
const dialog_1 = require("@/components/ui/dialog");
const button_1 = require("@/components/ui/button");
const form_1 = require("@/components/ui/form");
const input_1 = require("@/components/ui/input");
const select_1 = require("@/components/ui/select");
const textarea_1 = require("@/components/ui/textarea");
const lucide_react_1 = require("lucide-react");
const checkbox_1 = require("@/components/ui/checkbox");
const datetime_picker_1 = require("@/components/ui/datetime-picker");
const zod_1 = require("@hookform/resolvers/zod");
const react_hook_form_1 = require("react-hook-form");
const react_query_1 = require("@tanstack/react-query");
const use_toast_1 = require("@/hooks/use-toast");
const use_auth_1 = require("@/hooks/use-auth");
const react_2 = require("react");
const schema_1 = require("@shared/schema");
const api_client_1 = require("@/lib/api-client");
function RequestModal({ open, onOpenChange, onSuccess }) {
    const { toast } = (0, use_toast_1.useToast)();
    const queryClient = (0, react_query_1.useQueryClient)();
    const { user } = (0, use_auth_1.useAuth)();
    const apiClient = (0, api_client_1.createApiClient)();
    const { data: departments = [], isLoading: isDepartmentsLoading, error: departmentsError } = (0, react_query_1.useQuery)({
        queryKey: ["/api/departments"],
        queryFn: async () => {
            return await apiClient.request("/api/departments");
        },
        enabled: open
    });
    const [isError, setIsError] = (0, react_2.useState)(false);
    const taskOptions = [
        { id: 1, name: "Не работает принтер" },
        { id: 2, name: "Нет интернета" },
        { id: 3, name: "Не работает проектор" },
        { id: 4, name: "другое" },
    ];
    const form = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(schema_1.insertRequestSchema),
        defaultValues: {
            receiverDepartmentId: 0,
            taskId: 0,
            cabinet: '',
            phone: '',
            isUrgent: false,
            comment: ''
        }
    });
    (0, react_2.useEffect)(() => {
        if (departments.length && form.getValues().receiverDepartmentId === undefined) {
            form.reset({ ...form.getValues(), receiverDepartmentId: departments[0].id });
        }
    }, [departments]);
    (0, react_2.useEffect)(() => {
        if (departmentsError) {
            setIsError(true);
            console.error("Failed to load departments", departmentsError);
        }
    }, [departmentsError]);
    const createRequest = (0, react_query_1.useMutation)({
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
    return (<dialog_1.Dialog open={open} onOpenChange={onOpenChange}>
      <dialog_1.DialogContent>
        <dialog_1.DialogHeader>
          <dialog_1.DialogTitle>Новая заявка</dialog_1.DialogTitle>
        </dialog_1.DialogHeader>

        <form_1.Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createRequest.mutate(data))} className="space-y-4">
            <form_1.FormField control={form.control} name="receiverDepartmentId" render={({ field }) => (<form_1.FormItem>
                  <form_1.FormLabel>Подразделение</form_1.FormLabel>
                  {isDepartmentsLoading ? (<div className="flex justify-center items-center h-10">
                      <lucide_react_1.Loader2 className="h-8 w-8 animate-spin text-primary"/>
                    </div>) : isError ? (<div className="text-center py-2 text-red-500">
                      Error loading departments. Please try again.
                    </div>) : null}

                  <select_1.Select onValueChange={field.onChange} value={field.value?.toString()}>
                    <form_1.FormControl>
                      <select_1.SelectTrigger>
                        <select_1.SelectValue placeholder="Выберите подразделение"/>
                      </select_1.SelectTrigger>
                    </form_1.FormControl>
                    <select_1.SelectContent>
                      {departments.map((department) => (<select_1.SelectItem key={department.id} value={department.id.toString()}>
                          {department.name}
                        </select_1.SelectItem>))}
                    </select_1.SelectContent>
                  </select_1.Select>
                  <form_1.FormDescription>
                    Подразделение, которому направлена заявка.
                  </form_1.FormDescription>
                  <form_1.FormMessage />
                </form_1.FormItem>)}/>

            <form_1.FormField control={form.control} name="taskId" render={({ field }) => (<form_1.FormItem>
                  <form_1.FormLabel>Задача</form_1.FormLabel>
                  <select_1.Select onValueChange={(val) => field.onChange(+val)}>
                    <form_1.FormControl>
                      <select_1.SelectTrigger>
                        <select_1.SelectValue placeholder="Выберите задачу"/>
                      </select_1.SelectTrigger>
                    </form_1.FormControl>
                    <select_1.SelectContent>
                      {taskOptions.map((t) => (<select_1.SelectItem key={t.id} value={t.id.toString()}>
                          {t.name}
                        </select_1.SelectItem>))}
                    </select_1.SelectContent>
                  </select_1.Select>
                </form_1.FormItem>)}/>

            <form_1.FormField control={form.control} name="cabinet" render={({ field }) => (<form_1.FormItem>
                  <form_1.FormLabel>Кабинет (опционально)</form_1.FormLabel>
                  <form_1.FormControl>
                    <input_1.Input {...field} placeholder="301-А"/>
                  </form_1.FormControl>
                </form_1.FormItem>)}/>

            <form_1.FormField control={form.control} name="phone" render={({ field }) => (<form_1.FormItem>
                  <form_1.FormLabel>Номер телефона</form_1.FormLabel>
                  <form_1.FormControl>
                    <input_1.Input {...field} placeholder="Введите номер телефона"/>
                  </form_1.FormControl>
                </form_1.FormItem>)}/>

            <form_1.FormField control={form.control} name="isUrgent" render={({ field }) => (<form_1.FormItem className="flex items-center gap-2">
                  <form_1.FormControl>
                    <checkbox_1.Checkbox checked={field.value} onCheckedChange={field.onChange}/>
                  </form_1.FormControl>
                  <form_1.FormLabel>Срочная заявка</form_1.FormLabel>
                </form_1.FormItem>)}/>

            {isUrgent && (<form_1.FormField control={form.control} name="deadline" render={({ field }) => (<form_1.FormItem>
                    <form_1.FormLabel>Дедлайн</form_1.FormLabel>
                    <form_1.FormControl>
                      <datetime_picker_1.DateTimePicker {...field} value={field.value ? new Date(field.value) : undefined}/>
                    </form_1.FormControl>
                  </form_1.FormItem>)}/>)}

            <form_1.FormField control={form.control} name="comment" render={({ field }) => (<form_1.FormItem>
                  <form_1.FormLabel>Комментарий</form_1.FormLabel>
                  <form_1.FormControl>
                    <textarea_1.Textarea placeholder="Добавьте комментарий" {...field}/>
                  </form_1.FormControl>
                </form_1.FormItem>)}/>

            <dialog_1.DialogFooter>
              <button_1.Button type="submit" disabled={createRequest.isPending} className="ml-auto">
                {createRequest.isPending ? (<>
                    <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                    Создание...
                  </>) : (<>
                    <lucide_react_1.Plus className="mr-2 h-4 w-4"/>
                    Создать
                  </>)}
              </button_1.Button>
            </dialog_1.DialogFooter>
          </form>
        </form_1.Form>
      </dialog_1.DialogContent>
    </dialog_1.Dialog>);
}
