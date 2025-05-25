import { Router } from 'express';
import { db } from '../db'; // Теперь этот импорт должен работать
import { insertRequestSchema } from '@shared/schema';

const router = Router();

// GET /api/requests – список заявок текущего пользователя
router.get('/', async (req, res) => {
  const userId = req.session.userId;
  const { rows } = await db!.query(
    'SELECT * FROM requests WHERE sender_id = $1 OR receiver_department_id IN (SELECT department_id FROM users WHERE id = $1)',
    [userId]
  );
  res.json(rows);
});

// POST /api/requests – создать новую заявку
router.post('/', async (req, res) => {
  const parseResult = insertRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid request data' });
  }
  const { receiverDepartmentId, taskId, cabinet, phone, isUrgent, deadline, comment } = parseResult.data;
  const senderId = req.session.userId;

  // Normalize optional fields. Empty strings should be stored as NULL to avoid
  // Postgres casting errors for timestamp/boolean columns.
  const sanitizedCabinet = cabinet || null;
  const sanitizedPhone = phone || null;
  const sanitizedDeadline = deadline || null;
  const sanitizedComment = comment || null;

  try {
    const { rows } = await db!.query(
      'INSERT INTO requests(sender_id, receiver_department_id, task_id, cabinet, phone, is_urgent, deadline, comment) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [
        senderId,
        receiverDepartmentId,
        taskId,
        sanitizedCabinet,
        sanitizedPhone,
        isUrgent ?? false,
        sanitizedDeadline,
        sanitizedComment,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Failed to insert request:', err);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// PATCH /api/requests/:id/accept – взять заявку в работу
router.patch('/:id/accept', async (req, res) => {
  const requestId = +req.params.id;
  const userId = req.session.userId;

  try {
    const { rows } = await db!.query(
      "UPDATE requests SET status = 'в работе', who_accepted = $1, taken_at = NOW() WHERE id = $2 RETURNING *",
      [userId, requestId]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('Failed to accept request:', err);
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

// PATCH /api/requests/:id/complete – пометить заявку выполненной (добавить отзыв, оценку)
router.patch('/:id/complete', async (req, res) => {
  const requestId = +req.params.id;
  const { grade, reviewText } = req.body;
  const { rows } = await db!.query(
    'UPDATE requests SET grade = $1, review_text = $2, status = \'готово\', finished_at = NOW() WHERE id = $3 RETURNING *',
    [grade, reviewText, requestId]
  );
  res.json(rows[0]);
});
export default router;
