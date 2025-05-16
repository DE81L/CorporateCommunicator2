import { createApiClient } from '@/lib/api-client';
import type { WikiEntry, InsertWikiEntry, WikiCategory } from '@shared/schema';

const apiClient = createApiClient();

export async function getWikiEntries(): Promise<WikiEntry[]> {
  return (await apiClient.request<WikiEntry[]>('/wiki/entries')) ?? [];
}

export async function getWikiCategories(): Promise<WikiCategory[]> {
  return (await apiClient.request<WikiCategory[]>('/wiki/categories')) ?? [];
}

export async function createWikiEntry(data: InsertWikiEntry): Promise<WikiEntry> {
  const entry = await apiClient.request<WikiEntry>('/wiki/entries', {
    method: 'POST',
    body  : JSON.stringify(data),
  });
  if (!entry) throw new Error('createWikiEntry: no entry returned from server');
  return entry;
}
