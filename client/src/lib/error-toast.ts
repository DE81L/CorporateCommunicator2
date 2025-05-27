import { toast } from '@/hooks/use-toast';

export function showError(error: unknown, fallback = 'Unexpected error'): void {
  console.error(error);
  let description =
    error instanceof Error ? error.message : String(error ?? fallback);

  if (description === 'Failed to fetch') {
    description = 'Unable to connect to server. Please make sure it is running.';
  }

  toast({
    variant: 'destructive',
    title: 'Error',
    description,
  });
}
