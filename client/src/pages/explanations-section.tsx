import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import GroupChatSection from '@/pages/group-chat-section';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { createApiClient } from '@/lib/api-client';
import { queryClient } from '@/lib/queryClient';
import { showError } from '@/lib/error-toast';
import type { Group } from '@shared/schema';

const createSchema = z.object({
  name: z.string().min(1, 'Name required'),
  description: z.string().optional(),
});

type CreateValues = z.infer<typeof createSchema>;

export default function ExplanationsSection() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const apiClient = createApiClient();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [open, setOpen] = useState(false);

  const { data: groups = [], isLoading, error } = useQuery<Group[]>({
    queryKey: ['/api/explanations'],
    queryFn: async () => (await apiClient.request<Group[]>('/api/explanations')) ?? [],
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateValues) =>
      apiClient.request('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, isExplanation: true }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/explanations'] });
      setOpen(false);
    },
    onError: (err: Error) => showError(err, 'Failed to create'),
  });

  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: '', description: '' },
  });

  const onSubmit = (data: CreateValues) => createMutation.mutate(data);

  if (selectedGroup) {
    const readOnly = !user?.isAdmin && user?.id !== selectedGroup.creatorId;
    return (
      <div className="flex-1 overflow-auto">
        <Button className="m-2" variant="ghost" onClick={() => setSelectedGroup(null)}>
          {t('common.back', 'Back')}
        </Button>
        <GroupChatSection group={selectedGroup} readOnly={readOnly} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">{t('sidebar.nav.explanations')}</h2>
        {user?.isAdmin ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                {t('groups.newGroup')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('groups.newGroup')}</DialogTitle>
                <DialogDescription>
                  {t('groups.createGroup', 'Create group')}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea className="min-h-[100px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t('common.create', 'Create')}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">{t('errors.somethingWentWrong')}</div>
      ) : groups.length > 0 ? (
        <ul className="space-y-2">
          {groups.map((g) => (
            <li key={g.id}>
              <Button variant="ghost" className="w-full justify-start" onClick={() => setSelectedGroup(g)}>
                {g.name}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500">{t('announcements.noAnnouncements')}</p>
      )}
    </div>
  );
}
