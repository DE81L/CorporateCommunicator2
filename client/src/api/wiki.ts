import { createApiClient } from '@/lib/api-client';
import type { WikiEntry } from '@shared/schema';
import type { InsertWikiEntry, WikiCategory } from '@shared/schema';

const apiClient = createApiClient(); 
// — you may need to pass auth token: createApiClient(token)

export async function getWikiEntries(): Promise<WikiEntry[]> {
  // adjust the endpoint path & query as your server expects
  return (await apiClient.request<WikiEntry[]>('/api/wiki/entries')) ?? [];
}

export async function getWikiCategories(): Promise<WikiCategory[]> {
  return (await apiClient.request<WikiCategory[]>('/api/wiki/categories')) ?? [];
}

export async function createWikiEntry(
  data: InsertWikiEntry
): Promise<WikiEntry> {
  const entry = await apiClient.request<WikiEntry>('/api/wiki/entries', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!entry) {
    throw new Error('createWikiEntry: no entry returned from server');
  }
  return entry;
}