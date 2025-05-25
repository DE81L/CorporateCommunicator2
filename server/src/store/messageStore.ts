
import fs from 'fs';
import path from 'path';

export interface SyncMessage {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
}

const syncStore = new Map<number, SyncMessage[]>();
const fileStore = new Map<number, string>();
const timers = new Map<string, NodeJS.Timeout>();
const TTL_MS = 60 * 60 * 1000; // 1 hour

function schedule<T>(store: Map<any, T>, key: any) {
  const timerKey = `${store === fileStore ? 'f' : 's'}:${key}`;
  const existing = timers.get(timerKey);
  if (existing) clearTimeout(existing);
  timers.set(
    timerKey,
    setTimeout(() => {
      store.delete(key);
      timers.delete(timerKey);
    }, TTL_MS)
  );
}

export function addSyncMessages(userId: number, msgs: SyncMessage[]) {
  if (!syncStore.has(userId)) syncStore.set(userId, []);
  syncStore.get(userId)!.push(...msgs);
  schedule(syncStore, userId);
}

export function takeSyncMessages(userId: number): SyncMessage[] {
  const msgs = syncStore.get(userId) ?? [];
  syncStore.delete(userId);
  return msgs;
}

export function storeFile(messageId: number, path: string) {
  fileStore.set(messageId, path);
  schedule(fileStore, messageId);
}

export function getFile(messageId: number): string | undefined {
  return fileStore.get(messageId);
}

export function clearFile(messageId: number) {
  fileStore.delete(messageId);
}

export function findStoredFilePath(messageId: number): string | undefined {
  try {
    const uploadDir = path.join(process.cwd(), 'uploads');
    const files = fs.readdirSync(uploadDir);
    const name = files.find((f) => f.startsWith(`${messageId}.`));
    return name ? `/uploads/${name}` : undefined;
  } catch {
    return undefined;
  }
}
