export interface StoredMessage {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
  file?: string;
  synced?: boolean;
}

function key(myId: number, otherId: number) {
  return `msgs-${myId}-${otherId}`;
}

export function loadMessages(myId: number, otherId: number): StoredMessage[] {
  const raw = localStorage.getItem(key(myId, otherId));
  return raw ? JSON.parse(raw) : [];
}

export function saveMessages(myId: number, otherId: number, messages: StoredMessage[]): void {
  localStorage.setItem(key(myId, otherId), JSON.stringify(messages));
}

export function appendMessage(myId: number, otherId: number, message: StoredMessage): void {
  const msgs = loadMessages(myId, otherId);
  msgs.push(message);
  saveMessages(myId, otherId, msgs);
  console.info('Message stored in localStorage', { myId, otherId, message });
}

export function getConversationKeys(myId: number): string[] {
  return Object.keys(localStorage).filter((k) => k.startsWith(`msgs-${myId}-`));
}

export function getUnsyncedMessages(myId: number): { otherId: number; messages: StoredMessage[] }[] {
  return getConversationKeys(myId).map((k) => {
    const otherId = Number(k.split('-')[2]);
    const msgs = loadMessages(myId, otherId).filter((m) => !m.synced);
    return { otherId, messages: msgs };
  });
}

export function markMessagesSynced(myId: number, otherId: number, ids: number[]): void {
  const msgs = loadMessages(myId, otherId).map((m) =>
    ids.includes(m.id) ? { ...m, synced: true } : m,
  );
  saveMessages(myId, otherId, msgs);
}

export function clearMessages(myId: number, otherId: number): void {
  localStorage.removeItem(key(myId, otherId));
}
