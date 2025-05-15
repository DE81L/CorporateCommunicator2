import { Router } from 'express';
import { db } from '../db'; // Теперь этот импорт должен работать

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
  const { receiverDepartmentId, taskId, cabinet, phone, isUrgent, deadline, comment } = req.body;
  const senderId = req.session.userId;
  const { rows } = await db!.query(
    'INSERT INTO requests(sender_id, receiver_department_id, task_id, cabinet, phone, is_urgent, deadline, comment) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
    [senderId, receiverDepartmentId, taskId, cabinet, phone, isUrgent, deadline, comment]
  );
  res.status(201).json(rows[0]);
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