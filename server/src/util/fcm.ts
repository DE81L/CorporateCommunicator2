import { logger } from './logger'

/**
 * Отправить push через Firebase.
 */
export async function sendFcm(token: string, title: string, body: string): Promise<void> {
  const key = process.env.FCM_SERVER_KEY
  if (!key) throw new Error('FCM_SERVER_KEY not set')

  const res = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `key=${key}`,
    },
    body: JSON.stringify({
      to: token,
      notification: { title, body },
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    logger.warn('FCM response', text)
    throw new Error(`FCM status ${res.status}`)
  }
}
