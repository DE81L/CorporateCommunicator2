/// <reference path="../types/express-session.d.ts" />
import 'express-session';
import { Router, Request, Response } from 'express';
import fs from 'fs';
const fsp = fs.promises;
import path from 'path';
import bcrypt from 'bcrypt';
import { login, register } from '../lib/api/auth';
import { db } from '../db'; // Уже есть
import { logger } from '../util/logger'; // Уже есть
import { isAuthenticated } from '../middleware/auth'; // Уже есть
import { broadcastStatus, sendChatMessage, sendGroupMessage } from '../ws'; // Уже есть
import { sendEmailNotification } from '../util/email';
import { notifyUser } from '../util/push';
import departmentsRouter from './departments';
import jobsRouter from './jobs';
import wikiRouter from './wiki';
import requestsRouter from './requests';
import adminRouter from './admin';
import groupsRouter from './groups';
import notificationsRouter from './notifications';
import {
  addSyncMessages,
  takeSyncMessages,
  storeFile,
  getFile,
  clearFile,
  findStoredFilePath,
  type SyncMessage,
} from '../store/messageStore';

const router = Router();
router.use('/departments', isAuthenticated, departmentsRouter);
router.use('/jobs', isAuthenticated, jobsRouter);
router.use('/groups', isAuthenticated, groupsRouter);
router.use('/requests', isAuthenticated, requestsRouter);
router.use('/wiki', isAuthenticated, wikiRouter);
router.use('/admin', isAuthenticated, adminRouter);
router.use('/notifications', notificationsRouter);
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
         job_id     AS "jobId",
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
 * PATCH /api/user/job
 * Update current user's job position.
 * Body: { jobId: number | null }
 */
router.patch('/user/job', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.body as { jobId: number | null };
    const userId = req.session.userId as number;
    let title: string | null = null;
    if (jobId) {
      const { rows } = await db!.query<{ name: string }>(
        'SELECT name FROM jobs WHERE id = $1',
        [jobId]
      );
      title = rows[0]?.name ?? null;
    }
    await db!.query('UPDATE users SET job_id = $1, job_title = $2 WHERE id = $3', [jobId, title, userId]);
    res.json({ success: true, jobId, jobTitle: title });
  } catch (err) {
    logger.error('Update job error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

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
        jobId: number | null;
        jobTitle: string | null;
        isonline: boolean;
      }>(
        `SELECT
           id,
           username,
           email,
           first_name AS "firstName",
           last_name  AS "lastName",
           job_id     AS "jobId",
           job_title  AS "jobTitle",
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

      const limit = Math.min(Number(req.query.limit) || 50, 100);
      const before = req.query.before
        ? new Date(req.query.before as string)
        : new Date();

      const history = await db!.query(
        `SELECT
           id,
           sender_id   AS "senderId",
           receiver_id AS "receiverId",
           content,
           timestamp,
           status
         FROM messages
        WHERE ((sender_id = $1 AND receiver_id = $2)
           OR (sender_id = $2 AND receiver_id = $1))
          AND timestamp < $3
        ORDER BY timestamp DESC
        LIMIT $4`,
        [userId, chatWith, before, limit]
      );
      await db!.query(
        `UPDATE messages
            SET status = 'read'
          WHERE sender_id = $2
            AND receiver_id = $1
            AND status <> 'read'`,
        [userId, chatWith]
      );


      const withFiles = history.rows.map((m) => {
        let f = getFile(m.id);
        if (!f) {
          f = findStoredFilePath(m.id);
        } else {
          clearFile(m.id);
        }
        return { ...m, file: f ?? null };
      });
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
      if (file.startsWith('/uploads/')) {
        filePath = file;
        storeFile(message.id, filePath);
      } else {
        const uploadDir = path.join(process.cwd(), 'uploads');
        await fsp.mkdir(uploadDir, { recursive: true });
        const extMatch = /^data:(.*?);base64/.exec(file);
        const ext = extMatch ? extMatch[1].split('/')[1] || 'bin' : 'bin';
        const base64Data = file.replace(/^data:.*;base64,/, '');
        const name = `${message.id}.${ext}`;
        await fsp.writeFile(path.join(uploadDir, name), Buffer.from(base64Data, 'base64'));
        filePath = `/uploads/${name}`;
        storeFile(message.id, filePath);
      }
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
      try {
        await notifyUser(
          receiverId,
          {
            title: `New message from ${req.session.username}`,
            body: content,
          },
          db,
        );
      } catch (err) {
        logger.error('Push notify failed:', err);
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

/**
 * PATCH /api/messages/:id
 * Edit message content or mark it as deleted.
 * Body: { content?: string; deleted?: boolean }
 */
router.patch('/messages/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const messageId = Number(req.params.id);
    if (!messageId) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const { content, deleted }: { content?: string; deleted?: boolean } = req.body;

    if (content === undefined && deleted === undefined) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const userId = req.session.userId as number;
    const { rows } = await db!.query<{ sender_id: number }>(
      'SELECT sender_id FROM messages WHERE id = $1',
      [messageId]
    );
    const msg = rows[0];
    if (!msg) {
      return res.status(404).json({ error: 'Message not found' });
    }
    if (msg.sender_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const sets: string[] = [];
    const values: any[] = [];
    let i = 1;
    if (content !== undefined) {
      sets.push(`content = $${i++}`);
      values.push(content);
    }
    if (deleted !== undefined) {
      sets.push(`status = 'deleted'`);
    }
    values.push(messageId);
    const query = `UPDATE messages SET ${sets.join(', ')} WHERE id = $${i} RETURNING id, sender_id AS "senderId", receiver_id AS "receiverId", content, timestamp, status`;
    const updated = await db!.query(query, values);
    res.json(updated.rows[0]);
  } catch (err) {
    logger.error('PATCH /messages/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/groups/:groupId/messages
 * Returns message history for a group.
 */
router.get('/groups/:groupId/messages', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId as number;
    const groupId = Number(req.params.groupId);
    if (!groupId) return res.status(400).json({ error: 'Invalid group' });

    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const before = req.query.before ? new Date(req.query.before as string) : new Date();

    const history = await db!.query(
      `SELECT m.id,
              m.sender_id   AS "senderId",
              m.group_id    AS "groupId",
              m.content,
              m.timestamp,
              m.status,
              u.first_name  AS "firstName",
              u.last_name   AS "lastName",
              u.avatar_url  AS "avatarUrl"
         FROM messages m
         JOIN group_members gm ON gm.group_id = m.group_id AND gm.user_id = $1
         JOIN users u ON u.id = m.sender_id
        WHERE m.group_id = $2 AND m.timestamp < $3
        ORDER BY m.timestamp DESC
        LIMIT $4`,
      [userId, groupId, before, limit]
    );

    await db!.query(
      `UPDATE messages
          SET status = 'read'
        WHERE group_id = $2
          AND sender_id <> $1
          AND status <> 'read'`,
      [userId, groupId]
    );

    const withFiles = history.rows.map((m) => {
      let f = getFile(m.id);
      if (!f) {
        f = findStoredFilePath(m.id);
      } else {
        clearFile(m.id);
      }
      return { ...m, file: f ?? null };
    });
    res.json(withFiles);
  } catch (err) {
    logger.error('GET /groups/:groupId/messages error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/groups/:groupId/messages
 * Send a group message
 */
router.post('/groups/:groupId/messages', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const senderId = req.session.userId as number;
    const groupId = Number(req.params.groupId);
    if (!groupId) return res.status(400).json({ error: 'Invalid group' });

    const { content, file } = req.body as { content: string; file?: string };
    const insert = await db!.query(
      `INSERT INTO messages (sender_id, group_id, content, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id, sender_id AS "senderId", group_id AS "groupId", content, timestamp, status`,
      [senderId, groupId, content]
    );
    const message = insert.rows[0];
    let filePath: string | undefined;
    if (file) {
      if (file.startsWith('/uploads/')) {
        filePath = file;
        storeFile(message.id, filePath);
      } else {
        const uploadDir = path.join(process.cwd(), 'uploads');
        await fsp.mkdir(uploadDir, { recursive: true });
        const extMatch = /^data:(.*?);base64/.exec(file);
        const ext = extMatch ? extMatch[1].split('/')[1] || 'bin' : 'bin';
        const base64Data = file.replace(/^data:.*;base64,/, '');
        const name = `${message.id}.${ext}`;
        await fsp.writeFile(path.join(uploadDir, name), Buffer.from(base64Data, 'base64'));
        filePath = `/uploads/${name}`;
        storeFile(message.id, filePath);
      }
    }

    const { rows } = await db!.query<{ user_id: number }>(
      'SELECT user_id FROM group_members WHERE group_id = $1 AND user_id <> $2',
      [groupId, senderId]
    );
    const receivers = rows.map((r) => r.user_id);
    const deliveredTo = sendGroupMessage(receivers, { ...message, file: filePath });

    if (deliveredTo.length === receivers.length) {
      await db!.query("UPDATE messages SET status = 'delivered' WHERE id = $1", [message.id]);
      message.status = 'delivered';
    }

    const offline = receivers.filter((id) => !deliveredTo.includes(id));
    for (const id of offline) {
      try {
        await notifyUser(
          id,
          {
            title: `New group message`,
            body: content,
          },
          db,
        );
      } catch (err) {
        logger.error('Push notify failed:', err);
      }
    }

    res.json({ ...message, file: filePath });
  } catch (err) {
    logger.error('POST /groups/:groupId/messages error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/sync/messages', isAuthenticated, (req: Request, res: Response) => {
  const userId = req.session.userId as number;
  const msgs = Array.isArray(req.body) ? (req.body as SyncMessage[]) : [];
  addSyncMessages(userId, msgs);
  res.json({ success: true });
});

router.get('/sync/messages', isAuthenticated, (req: Request, res: Response) => {
  const userId = req.session.userId as number;
  const msgs = takeSyncMessages(userId);
  res.json(msgs);
});

export default router;
