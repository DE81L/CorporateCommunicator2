import { Router } from 'express';
import { login, register } from '../lib/api/auth';
import { logger } from '@shared/logger';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    const user = await login(usernameOrEmail, password);
    
    // Set session
    (req.session as any).userId = user.id;
    res.json(user);
  } catch (error) {
    logger.error('Login error:', error);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const user = await register(req.body);
    res.status(201).json(user);
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(400).json({ error: 'Registration failed' });
  }
});

router.get('/user', async (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  // ... get user data
  res.json({ id: userId });
});

export default router;
