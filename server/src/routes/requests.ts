import { Router } from 'express';
import { db } from '../db'; // Теперь этот импорт должен работать
import { insertRequestSchema } from '@shared/schema';

const router = Router();

// GET /api/requests – список заявок текущего пользователя
router.get('/', async (req, res) => {
  const userId = req.session.userId;
  const { rows } = await db!.query(
    `SELECT
       id,
       sender_id              AS "senderId",
       receiver_department_id AS "receiverDepartmentId",
       task_id                AS "taskId",
       cabinet,
       phone,
       is_urgent              AS "isUrgent",
       deadline,
       comment,
       who_accepted           AS "whoAccepted",
       taken_at               AS "takenAt",
       grade,
       review_text            AS "reviewText",
       finished_at            AS "finishedAt",
       status,
       created_at             AS "createdAt"
     FROM requests
    WHERE sender_id = $1
       OR receiver_department_id IN (SELECT department_id FROM users WHERE id = $1)`,
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
  const userId = req.session.userId;
  const { grade, reviewText } = req.body;
  try {
    const check = await db!.query('SELECT sender_id FROM requests WHERE id = $1', [requestId]);
    if (check.rows[0]?.sender_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { rows } = await db!.query(
      "UPDATE requests SET grade = $1, review_text = $2, status = 'готово', finished_at = NOW() WHERE id = $3 RETURNING *",
      [grade, reviewText, requestId]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('Failed to complete request:', err);
    res.status(500).json({ error: 'Failed to complete request' });
  }
});

// PATCH /api/requests/:id – обновить существующую заявку
router.patch('/:id', async (req, res) => {
  const requestId = +req.params.id;
  const userId = req.session.userId;
  const { cabinet, phone, isUrgent, deadline, comment } = req.body;

  const sanitizedCabinet = cabinet || null;
  const sanitizedPhone = phone || null;
  const sanitizedDeadline = deadline || null;
  const sanitizedComment = comment || null;

  try {
    const { rows } = await db!.query(
      `UPDATE requests
          SET cabinet = $1,
              phone = $2,
              is_urgent = $3,
              deadline = $4,
              comment = $5
        WHERE id = $6 AND sender_id = $7
        RETURNING *`,
      [
        sanitizedCabinet,
        sanitizedPhone,
        isUrgent ?? false,
        sanitizedDeadline,
        sanitizedComment,
        requestId,
        userId,
      ]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Failed to update request:', err);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// DELETE /api/requests/:id – удалить заявку
router.delete('/:id', async (req, res) => {
  const requestId = +req.params.id;
  const userId = req.session.userId;

  try {
    const { rows } = await db!.query(
      'DELETE FROM requests WHERE id = $1 AND sender_id = $2 RETURNING *',
      [requestId, userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Failed to delete request:', err);
    res.status(500).json({ error: 'Failed to delete request' });
  }
});
export default router;
