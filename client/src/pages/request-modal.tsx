import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
} from "@/components/ui/form";
import { Input, Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue, Textarea } from "@/components/ui";
import { Loader2, Plus } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast, useElectron } from "@/hooks";
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RequestModal({ open, onOpenChange, onSuccess }: Props) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user, subdivisions } = useElectron()

  const taskOptions = [
    { id: "1", name: "Не работает принтер" },
    { id: "2", name: "Нет интернета" },
    { id: "3", name: "Не работает проектор" },
    { id: "4", name: "другое" },
  ]

  const requestSchema = z.object({
    receiverSubdivisionId: z.coerce.number(),
    cabinet: z.string().optional(),
    taskId: z.string().min(1, "Выберите задачу"),
    customTitle: z.string().optional(),
    comment: z.string().optional(),
  });

  type RequestFormValues = z.infer<typeof requestSchema>;

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      receiverSubdivisionId: subdivisions[0]?.id ?? 0,
      taskId: taskOptions[0]?.id ?? "",
    },
  });

  const createRequest = useMutation({
    mutationFn: async (data: RequestFormValues) => {
      const payload = {
        ...data,
        numberOfRequest: crypto.randomUUID().slice(0, 8),
        requestStatus: 'новая',
        grade: null, // Initialize grade
      };
      const res = await fetch("/api/requests", {
        method: "POST", // create a new request
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

  const isOtherSelected = form.watch("taskId") === "4";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новая заявка</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => createRequest.mutate(data))}
            className="space-y-4"
          >
            <FormField control={form.control} name="receiverSubdivisionId" render={({ field }) => (
              <FormItem>
                <FormLabel>Получатель</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите подразделение" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      {subdivisions.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="phone" render={() => (
              <FormItem>
                <FormLabel>Номер телефона</FormLabel>
                <FormControl>
                  <Input value={user?.phone} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="cabinet" render={({ field }) => (
              <FormItem>
                <FormLabel>Кабинет (опционально)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="301-А" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="taskId" render={({ field }) => (
              <FormItem>
                <FormLabel>Задача</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите задачу" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      {taskOptions.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            {isOtherSelected && (
              <FormField control={form.control} name="customTitle" render={({ field }) => (
                <FormItem>
                  <FormLabel>Название задачи</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Введите название задачи" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}
             <FormField control={form.control} name="comment" render={({ field }) => (
              <FormItem>
                <FormLabel>Комментарий</FormLabel>
                <FormControl>
                  <Textarea placeholder="Добавьте комментарий" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
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