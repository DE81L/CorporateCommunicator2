import { Router, Request, Response } from 'express';
// Используем локальную заглушку multer
import multer from '../stubs/multer';
import path from 'path';
import { db } from '../db';
import { logger } from '../util/logger';

// хранилище файлов для аватаров
const upload = multer({ dest: path.join(process.cwd(), 'server/uploads/avatars') });

const router: Router = Router();

// POST /api/user/avatar - загрузка нового аватара и обновление профиля
router.post('/avatar', upload.single('avatar'), async (req: Request, res: Response) => {
  const { username, email } = req.body as { username: string; email: string };
  const userId = req.session.userId as number;
  // multer добавляет поле file динамически, используем собственный тип
  const file = (req as any).file as { filename: string } | undefined;
  if (!userId || !file) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  const avatarUrl = `/uploads/avatars/${file.filename}`;
  try {
    await db!.query(
      'UPDATE users SET username = $1, email = $2, avatarurl = $3 WHERE id = $4',
      [username, email, avatarUrl, userId]
    );
    res.sendStatus(204);
  } catch (err) {
    logger.error('Avatar update failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
