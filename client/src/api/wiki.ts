import { createApiClient } from '@/lib/api-client';
import type { WikiEntry } from '@shared/schema';
import type { InsertWikiEntry, WikiCategory } from '@shared/schema';

const apiClient = createApiClient();
// — возможно, потребуется передать токен: createApiClient(token)

export async function getWikiEntries(): Promise<WikiEntry[]> {
  // скорректируйте путь и параметры запроса по требованиям сервера
  return (await apiClient.request<WikiEntry[]>('/api/wiki/entries')) ?? [];
}

export async function getWikiCategories(): Promise<WikiCategory[]> {
  return (await apiClient.request<WikiCategory[]>('/api/wiki/categories')) ?? [];
}

export async function getWikiEntry(id: number): Promise<WikiEntry | undefined> {
  return apiClient.request<WikiEntry>(`/api/wiki/entries/${id}`);
}

export async function createWikiEntry(
  data: InsertWikiEntry
): Promise<WikiEntry> {
  const entry = await apiClient.request<WikiEntry>('/api/wiki/entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!entry) {
    throw new Error('createWikiEntry: no entry returned from server');
  }
  return entry;
}

export async function updateWikiEntry(
  id: number,
  patch: Partial<InsertWikiEntry>
): Promise<WikiEntry | undefined> {
  return apiClient.request<WikiEntry>(`/api/wiki/entries/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
}