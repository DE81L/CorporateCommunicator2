import { createApiClient } from '@/lib/api-client';

const api = createApiClient();

export interface Task { id: number; name: string; category: string; }

export async function getTasks(): Promise<Task[]> {
  return (await api.request<Task[]>('/tasks')) ?? [];
}
