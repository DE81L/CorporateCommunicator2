import { Router } from 'express';
import { db } from '../db'; // Теперь этот импорт должен работать

const router = Router();
router.get('/', async (req, res) => {
  try {
    // Проверяем, что db не null перед использованием
    if (!db) {
      return res.status(503).json({ message: 'База данных не подключена' });
    }
    const { rows } = await db.query('SELECT id, name FROM departments');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при получении подразделений' });
  }
});
export default router;