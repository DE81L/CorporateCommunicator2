import { sendToUser } from '../ws'
import { db } from '../db'
import { sendFcm } from './fcm'
import { sendMail } from './mail'

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
  _db?: typeof db,
) {
  // сперва пытаемся отправить FCM, иначе шлём email
  sendToUser(userId, { type: 'notify', payload: message })
  const client = _db ?? db
  if (!client) return

  try {
    const { rows } = await client.query<{ token: string }>(
      'SELECT token FROM push_tokens WHERE user_id = $1',
      [userId],
    )
    if (rows.length === 0) throw new Error('No FCM token')
    for (const { token } of rows) {
      await sendFcm(token, message.title, message.body)
    }
    return
  } catch (err: any) {
    console.warn('FCM failed:', err.message)
  }

  try {
    const { rows } = await client.query<{ email: string }>(
      'SELECT email FROM users WHERE id = $1',
      [userId],
    )
    const email = rows[0]?.email
    if (email) {
      await sendMail(email, message.title, message.body)
    }
  } catch (err: any) {
    console.warn('Email failed:', err.message)
  }
}
