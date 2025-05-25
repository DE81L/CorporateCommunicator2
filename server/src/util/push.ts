export interface PushMessage {
  title: string;
  body: string;
}

/**
 * Send a push notification via Firebase Cloud Messaging.
 * Requires FCM_SERVER_KEY environment variable.
 */
export async function sendPushNotification(token: string, message: PushMessage) {
  const key = process.env.FCM_SERVER_KEY;
  if (!key) {
    throw new Error('FCM_SERVER_KEY not configured');
  }
  const res = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `key=${key}`,
    },
    body: JSON.stringify({
      to: token,
      notification: { title: message.title, body: message.body },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FCM error ${res.status}: ${text}`);
  }
}

/**
 * Find push tokens of the user and send a notification to all of them.
 */
export async function notifyUser(
  userId: number,
  message: PushMessage,
  db: import('pg').Client | null,
) {
  if (!db) return;
  const { rows } = await db.query<{ token: string }>(
    'SELECT token FROM push_tokens WHERE user_id = $1',
    [userId],
  );
  for (const r of rows) {
    try {
      await sendPushNotification(r.token, message);
    } catch (err) {
      // Ignore single send errors
    }
  }
}
