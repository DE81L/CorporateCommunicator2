import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useElectron } from "@/hooks/use-electron";
import { useState, useEffect } from "react";
import { insertRequestSchema } from "@shared/schema";
import { z } from "zod";

interface RequestFormValues {
  receiverDepartmentId: number;
  taskId: number;
  cabinet: string;
  phone: string;
  isUrgent: boolean;
  deadline: string;
  comment: string;
}

interface Props {
  requests?: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function RequestModal({ open, onOpenChange, onSuccess }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { api } = useElectron();

  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const deptsRes = await fetch('/api/departments', { credentials:'include' });
        if (!deptsRes.ok) throw new Error('Не удалось загрузить список подразделений');
        const depts = await deptsRes.json();
        setDepartments(depts);
        form.reset({ ...form.getValues(), receiverDepartmentId: depts[0]?.id ?? 0 });
      } catch(e) {
        console.error(e)
      }
    })();
  }, [open]);

  const taskOptions = [
    { id: 1, name: "Не работает принтер" },
    { id: 2, name: "Нет интернета" },
    { id: 3, name: "Не работает проектор" },
    { id: 4, name: "другое" },
  ];

  const form = useForm<RequestFormValues>({
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

  const createRequest = useMutation({
    mutationFn: async (data: RequestFormValues) => {
      const payload = {
        ...data,
        creatorId: user?.id,
        numberOfRequest: crypto.randomUUID().slice(0, 8),
        requestStatus: "новая",
        grade: null,
      };
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Ошибка API: ${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Заявка создана" });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      onOpenChange(false);
      onSuccess();
    },
    onError: (err: any) =>
      toast({
        title: "Не удалось создать заявку",
        description: err.message,
        variant: "destructive",
      }),
  });

  const isUrgent = form.watch("isUrgent");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новая заявка</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createRequest.mutate(data))} 
                className="space-y-4">
            <FormField
              control={form.control}
              name="receiverDepartmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Подразделение</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите подразделение" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id.toString()}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Подразделение, которому направлена заявка.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taskId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Задача</FormLabel>
                  <Select onValueChange={(val: string) => field.onChange(+val)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите задачу" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {taskOptions.map(t => (
                          <SelectItem key={t.id} value={t.id.toString()}>
                            {t.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cabinet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Кабинет (опционально)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="301-А" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Номер телефона</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Введите номер телефона" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isUrgent"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox 
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Срочная заявка</FormLabel>
                </FormItem>
              )}
            />

            {isUrgent && (
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дедлайн</FormLabel>
                    <FormControl>
                      <DateTimePicker {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Комментарий</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Добавьте комментарий" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="submit"
                disabled={createRequest.isPending}
                className="ml-auto"
              >
                {createRequest.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Создание...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Создать
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}