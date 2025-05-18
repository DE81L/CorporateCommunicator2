export interface StoredMessage {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
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
}

export function clearMessages(myId: number, otherId: number): void {
  localStorage.removeItem(key(myId, otherId));
}
