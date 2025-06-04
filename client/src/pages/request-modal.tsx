import React from 'react';
import { showError } from '@/lib/error-toast';
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
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { insertRequestSchema } from "@shared/schema";
import { z } from "zod";
import { createApiClient } from "@/lib/api-client";
import type { Request } from "./requests-section";
import { getTasks } from "@/api/tasks";
import { updateRequest } from "@/api/requests";

export type Subdivision = {
  id: number;
  name: string;
};

interface RequestFormValues {
  receiverSubdivisionId?: number;
  taskId: number;
  cabinet: string;
  phone: string;
  isUrgent: boolean;
  deadline?: string;
  comment: string;
}

interface Props {
  request?: Request;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RequestModal({ request, open, onOpenChange, onSuccess }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const apiClient = createApiClient();
  const {
    data: subdivisions = [],
    isLoading: isSubdivisionsLoading,
    error: subdivisionsError,
  } = useQuery<{ id: number; name: string }[]>({
    queryKey: ["/api/departments"],
    queryFn: async (): Promise<{ id: number; name: string }[]> => {
      const depts = await apiClient.request<Subdivision[]>("/api/departments");
      return depts ?? [];
    },
    enabled: open
  });

  const [isError, setIsError] = useState<boolean>(false);

  const { data: taskOptions = [], isLoading: tasksLoading, error: tasksError } =
    useQuery({
      queryKey: ["/api/tasks"],
      queryFn: getTasks,
      enabled: open,
    });

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(insertRequestSchema),
    defaultValues: request
      ? {
          receiverSubdivisionId: request.receiverSubdivisionId,
          taskId: request.taskId,
          cabinet: request.cabinet ?? '',
          phone: request.phone ?? '',
          isUrgent: request.isUrgent,
          deadline: request.deadline ?? '',
          comment: request.comment ?? ''
        }
      : {
          receiverSubdivisionId: 0,
          taskId: 0,
          cabinet: '',
          phone: '',
          isUrgent: false,
          deadline: '',
          comment: ''
        },
  });

  useEffect(() => {
    if (subdivisions.length && form.getValues().receiverSubdivisionId === undefined) {
      form.reset({ ...form.getValues(), receiverSubdivisionId: subdivisions[0].id });
    }
  }, [subdivisions]);

  useEffect(() => {
    if (subdivisionsError) {
      setIsError(true);
      showError(subdivisionsError, 'Failed to load departments');
    }
  }, [subdivisionsError]);

  useEffect(() => {
    if (tasksError) {
      setIsError(true);
      showError(tasksError, 'Failed to load tasks');
    }
  }, [tasksError]);

  useEffect(() => {
    if (taskOptions.length && form.getValues().taskId === 0) {
      form.setValue('taskId', taskOptions[0].id);
    }
  }, [taskOptions]);

  const saveRequest = useMutation({
    mutationFn: async (data: RequestFormValues) => {
      const payload = { ...data, creatorId: user?.id };
      if (request) {
        return updateRequest(request.id, payload);
      }
      const res = await apiClient.request("/api/requests", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res;
    },
    onSuccess: () => {
      toast({ title: request ? "Заявка обновлена" : "Заявка создана" });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      onOpenChange(false);
      onSuccess();
    },
    onError: (err: any) =>
      toast({
        title: request ? "Не удалось обновить заявку" : "Не удалось создать заявку",
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
          <DialogDescription>Введите данные для создания заявки</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => saveRequest.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="receiverSubdivisionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Подразделение</FormLabel>
                  {isSubdivisionsLoading ? (
                    <div className="flex justify-center items-center h-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : isError ? (
                    <div className="text-center py-2 text-red-500">
                      Error loading departments. Please try again.
                    </div>
                  ) : null}

                  <Select
                    onValueChange={(val: string) => field.onChange(+val)}
                    value={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите подразделение" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subdivisions.map((department: { id: number; name: string }) => (
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
                      {tasksLoading ? (
                        <div className="flex justify-center items-center h-10">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : tasksError ? (
                        <div className="text-center py-2 text-red-500">
                          Error loading tasks. Please try again.
                        </div>
                      ) : (
                        taskOptions.map((t) => (
                          <SelectItem key={t.id} value={t.id.toString()}>
                            {t.name}
                          </SelectItem>
                        ))
                      )}
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isUrgent"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
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
                      <DateTimePicker
                        {...field}
                        value={field.value ? new Date(field.value) : undefined}
                      />
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
                disabled={saveRequest.isPending}
                className="ml-auto"
              >
                {saveRequest.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {request ? 'Сохранение...' : 'Создание...'}
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    {request ? 'Сохранить' : 'Создать'}
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

export default RequestModal;
