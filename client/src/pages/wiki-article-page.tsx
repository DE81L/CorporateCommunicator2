import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from '@/lib/remark-breaks';
import { useQuery, useMutation } from '@tanstack/react-query';
import { createApiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { DialogFooter } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Edit, Loader2 } from 'lucide-react';
import { getWikiEntry, updateWikiEntry } from '../api/wiki';
import { useToast } from '@/hooks/use-toast';

const entrySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  category: z.string().optional(),
});

type EntryValues = z.infer<typeof entrySchema>;

export default function WikiArticlePage() {
  const [, params] = useRoute<{ id: string }>('/wiki/:id');
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const apiClient = createApiClient();

  const { data: entry, isLoading, refetch } = useQuery({
    queryKey: ['/api/wiki/entries', id],
    enabled: !!id,
    queryFn: () => getWikiEntry(id),
    retry: false,
  });

  const form = useForm<EntryValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: { title: '', content: '', category: '' },
  });

  useEffect(() => {
    if (entry) {
      form.reset({
        title: entry.title || '',
        content: entry.content,
        category: entry.category || '',
      });
    }
  }, [entry, form]);

  const updateMutation = useMutation({
    mutationFn: (values: EntryValues) =>
      updateWikiEntry(id, {
        title: values.title,
        content: values.content,
        category: values.category,
        lastEditorId: user?.id,
        updatedAt: new Date(),
      }),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Wiki entry updated' });
      refetch();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update entry', variant: 'destructive' });
    },
  });

  const [isEditing, setIsEditing] = useState(false);

  const onSubmit = (values: EntryValues) => {
    updateMutation.mutate(values);
    setIsEditing(false);
  };

  if (isLoading || !entry) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 w-full">
      <Button variant="ghost" size="icon" onClick={() => setLocation('/')}
        className="mb-4">
        <ArrowLeft className="h-5 w-5" />
      </Button>

      {isEditing ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[300px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">{entry.title ?? 'Untitled'}</h1>
            {user?.isAdmin && (
              <Button size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
          <div className="prose max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
              {entry.content}
            </ReactMarkdown>
          </div>
        </>
      )}
    </div>
  );
}
