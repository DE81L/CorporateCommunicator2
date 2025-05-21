/// <reference path="../types/express-session.d.ts" />
import 'express-session';
import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { login, register } from '../lib/api/auth';
import { db } from '../db'; // Уже есть
import { logger } from '../util/logger'; // Уже есть
import { isAuthenticated } from '../middleware/auth'; // Уже есть
import { broadcastStatus, sendChatMessage } from '../ws'; // Уже есть
import { sendEmailNotification } from '../util/email';
import departmentsRouter from './departments';
import wikiRouter from './wiki';
import requestsRouter from './requests';

interface SyncMessage {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
}

const syncStore = new Map<number, SyncMessage[]>();
const fileStore = new Map<number, string>();

const router = Router();
router.use('/departments', isAuthenticated, departmentsRouter);
router.use('/requests', isAuthenticated, requestsRouter);
router.use('/wiki', isAuthenticated, wikiRouter);
/**
 * POST /api/login
 * Логин пользователя.
 * Тело: { usernameOrEmail: string, password: string }
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { usernameOrEmail, password }: { usernameOrEmail: string; password: string } = req.body;
    const user = await login(usernameOrEmail, password);
    // сохраняем в сессии
    req.session.userId = user.id;
    req.session.username = user.username;
    await new Promise<void>((resolve, reject) =>
      req.session.save(err => (err ? reject(err) : resolve()))
    );
    await db!.query('UPDATE users SET isonline = 1 WHERE id = $1', [user.id]);
    broadcastStatus(user.id, 1);
    res.json({ ...user, isOnline: 1 });
  } catch (err) {
    logger.error('Login error:', err);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

/**
 * POST /api/register
 * Регистрация нового пользователя.
 * Тело: { username, email, password, firstName, lastName }
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const newUser = await register(req.body);
    // логин в сессии сразу после регистрации
    req.session.userId = newUser.id;
    req.session.username = newUser.username;
    await new Promise<void>((resolve, reject) =>
      req.session.save(err => (err ? reject(err) : resolve()))
    );
    await db!.query('UPDATE users SET isonline = 1 WHERE id = $1', [newUser.id]);
    broadcastStatus(newUser.id, 1);
    res.status(201).json({ ...newUser, isOnline: 1 });
  } catch (err) {
    logger.error('Register error:', err);
    res.status(400).json({ error: 'Invalid request' });
  }
});

/**
 * GET /api/user
 * Информация о текущем пользователе.
 */
router.get('/user', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId as number;
    const result = await db!.query(
      `SELECT
         id,
         username,
         email,
         first_name AS "firstName",
         last_name  AS "lastName",
         job_title  AS "jobTitle",
         avatarurl  AS "avatarUrl",
         is_admin   AS "isAdmin",
         isonline   AS "isOnline"
       FROM users
       WHERE id = $1`,
      [userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Get current user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/change-password
 * Смена пароля текущего пользователя.
 * Тело: { currentPassword: string; newPassword: string }
 */
router.post(
  '/change-password',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body as {
        currentPassword: string;
        newPassword: string;
      };
      const userId = req.session.userId as number;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Missing fields' });
      }

      const result = await db!.query<{ password: string }>(
        'SELECT password FROM users WHERE id = $1',
        [userId]
      );
      const user = result.rows[0];
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return res.status(400).json({ error: 'Incorrect current password' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(newPassword, salt);

      await db!.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, userId]);

      res.json({ success: true });
    } catch (err) {
      logger.error('Change password error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/**
 * PATCH /api/users/status
 * Обновление online/offline статуса пользователя.
 * Тело: { isonline: 0|1 }
 */
router.patch(
  '/users/status',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { isonline } = req.body as { isonline: 0 | 1 };
      const userId = req.session.userId as number;
      if (isonline !== 0 && isonline !== 1) {
        return res.status(400).json({ error: 'Invalid isonline value' });
      }
      await db!.query(
        `UPDATE users SET isonline = $1 WHERE id = $2`,
        [isonline, userId]
      );
      broadcastStatus(userId, isonline);
      res.json({ success: true });
    } catch (err) {
      logger.error('Status update error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Для поддержки navigator.sendBeacon, который всегда посылает POST
// на смену статуса, добавляем эквивалентный POST-эндпоинт
router.post(
  '/users/status',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { isonline } = req.body as { isonline: 0 | 1 };
      const userId = req.session.userId as number;
      if (isonline !== 0 && isonline !== 1) {
        return res.status(400).json({ error: 'Invalid isonline value' });
      }
      await db!.query(
        `UPDATE users SET isonline = $1 WHERE id = $2`,
        [isonline, userId]
      );
      broadcastStatus(userId, isonline);
      res.json({ success: true });
    } catch (err) {
      logger.error('Status update error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/**
 * GET /api/contacts
 * Список всех пользователей (кроме себя) с полем isonline.
 */
router.get(
  '/contacts',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;

      // Возвращаем всех пользователей, кроме самого себя
      const { rows: contacts } = await db!.query<{
        id: number;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
        isonline: boolean;
      }>(
        `SELECT
           id,
           username,
           email,
           first_name AS "firstName",
           last_name  AS "lastName",
           isonline
         FROM users
         WHERE id <> $1;`,
        [userId],
      );

      return res.json(contacts);
    } catch (err) {
      logger.error('Get contacts error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }
);



/**
 * GET /api/messages?chatWith={id}
 * Возвращает всю историю между текущим пользователем и chatWith,
 * а также помечает входящие сообщения как прочитанные.
 */
router.get(
  '/messages',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      const chatWith = Number(req.query.chatWith);
      if (!chatWith) {
        return res.status(400).json({ error: 'chatWith is required' });
      }
      const history = await db!.query(
        `SELECT
           id,
           sender_id   AS "senderId",
           receiver_id AS "receiverId",
           content,
           timestamp,
           status
         FROM messages
        WHERE (sender_id = $1 AND receiver_id = $2)
           OR (sender_id = $2 AND receiver_id = $1)
        ORDER BY timestamp DESC`,
        [userId, chatWith]
      );
      await db!.query(
        `UPDATE messages
            SET status = 'read'
          WHERE sender_id = $2
            AND receiver_id = $1
            AND status <> 'read'`,
        [userId, chatWith]
      );

      await db!.query(
        `DELETE FROM messages
          WHERE sender_id = $2
            AND receiver_id = $1
            AND status = 'read'`,
        [userId, chatWith]
      );

      const withFiles = history.rows.map((m) => ({
        ...m,
        file: fileStore.get(m.id) ?? null,
      }));
      res.json(withFiles);
    } catch (err) {
      logger.error('GET /messages error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/**
 * POST /api/messages
 * Отправка сообщения: сохраняет в БД, и если оба пользователя онлайн —
 * сразу шлёт по WS и помечает как доставленное.
 * Тело: { receiverId: number; content: string }
 */
router.post('/messages', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { receiverId, content, file } = req.body as {
      receiverId: number;
      content: string;
      file?: string;
    };
    const senderId = req.session.userId as number;

    const insert = await db!.query(
      `INSERT INTO messages (sender_id, receiver_id, content, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id, sender_id AS "senderId", receiver_id AS "receiverId", content, timestamp, status`,
      [senderId, receiverId, content]
    );

    const message = insert.rows[0];
    let filePath: string | undefined;
    if (file) {
      const uploadDir = path.join(process.cwd(), 'uploads');
      fs.mkdirSync(uploadDir, { recursive: true });
      const extMatch = /^data:(.*?);base64/.exec(file);
      const ext = extMatch ? extMatch[1].split('/')[1] || 'bin' : 'bin';
      const base64Data = file.replace(/^data:.*;base64,/, '');
      const name = `${message.id}.${ext}`;
      fs.writeFileSync(path.join(uploadDir, name), Buffer.from(base64Data, 'base64'));
      filePath = `/uploads/${name}`;
      fileStore.set(message.id, filePath);
    }

    const delivered = sendChatMessage(receiverId, { ...message, file: filePath });

    if (delivered) {
      await db!.query("UPDATE messages SET status = 'delivered' WHERE id = $1", [
        message.id,
      ]);
      message.status = 'delivered';
    } else {
      const { rows } = await db!.query<{ email: string; username: string }>(
        'SELECT email, username FROM users WHERE id = $1',
        [receiverId]
      );
      const recipient = rows[0];
      if (recipient?.email) {
        try {
          await sendEmailNotification(
            recipient.email,
            `New message from ${req.session.username}`,
            `${req.session.username} sent you a message: ${content}`
          );
        } catch (err) {
          logger.error('Failed to send email notification:', err);
        }
      }
    }

    logger.info({ senderId, receiverId, delivered }, 'Message stored on server');

    res.json({ ...message, file: filePath });
  } catch (error) {
    logger.error({ err: error }, 'Error sending message');
    const detail = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Server error', detail });
  }
});

router.post('/sync/messages', isAuthenticated, (req: Request, res: Response) => {
  const userId = req.session.userId as number;
  const msgs = Array.isArray(req.body) ? (req.body as SyncMessage[]) : [];
  if (!syncStore.has(userId)) syncStore.set(userId, []);
  syncStore.get(userId)!.push(...msgs);
  res.json({ success: true });
});

router.get('/sync/messages', isAuthenticated, (req: Request, res: Response) => {
  const userId = req.session.userId as number;
  const msgs = syncStore.get(userId) ?? [];
  syncStore.set(userId, []);
  res.json(msgs);
});

export default router;
