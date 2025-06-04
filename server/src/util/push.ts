import { sendToUser } from '../ws';

export interface PushMessage {
  title: string;
  body: string;
}

/**
 * Find push tokens of the user and send a notification to all of them.
 */
export async function notifyUser(
  userId: number,
  message: PushMessage,
  _db?: unknown,
) {
  sendToUser(userId, { type: 'notify', payload: message });
}
