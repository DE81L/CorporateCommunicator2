import { Router } from 'express';
import { db } from '../db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, name FROM departments');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при получении подразделений' });
  }
});

export default router;
