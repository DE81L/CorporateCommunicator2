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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useElectron } from "@/hooks/use-electron";
import { useState, useEffect } from "react";
import { insertRequestSchema } from "@shared/schema";
import { z } from "zod";

type RequestFormValues = z.infer<typeof insertRequestSchema>;

interface Props {
  requests?: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function RequestModal({ open, onOpenChange, onSuccess, requests = [] }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { api } = useElectron();

  const [subdivisions, setSubdivisions] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const subs = await fetch("/api/subdivisions", { credentials: 'include' }).then(r => r.json());
      setSubdivisions(subs);
      form.reset({ ...form.getValues(), receiverSubdivisionId: subs[0]?.id ?? 0 });
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
      receiverSubdivisionId: subdivisions[0]?.id ?? 0,
      taskId: taskOptions[0]?.id ?? 0,
      phone: user?.phone ?? '',
      cabinet: '',
      customTitle: '',
      comment: '',
    },
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

  const isOtherSelected = form.watch("taskId") === 4;

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
                <Select onValueChange={(val) => field.onChange(+val)} defaultValue={String(field.value)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите подразделение" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      {subdivisions.length
                        ? subdivisions.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)
                        : <div className="px-2 py-1 text-xs text-muted-foreground">Нет подразделений</div>
                      }
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
                <Select onValueChange={(val) => field.onChange(+val)} defaultValue={String(field.value)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите задачу" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      {taskOptions.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
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