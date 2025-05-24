import { toast } from '@/hooks/use-toast';

export function showError(error: unknown, fallback = 'Unexpected error'): void {
  console.error(error);
  const description = error instanceof Error ? error.message : String(error ?? fallback);
  toast({
    variant: 'destructive',
    title: 'Error',
    description,
  });
}
