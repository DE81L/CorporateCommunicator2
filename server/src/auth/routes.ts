import { Router } from 'express';
import { z } from 'zod';
import * as bcrypt from 'bcrypt';
import { db } from '../db';
import { logger } from '@shared/logger';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  usernameOrEmail: z.string().min(1),
  password: z.string().min(6)
});

const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string(),
  lastName: z.string()
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = loginSchema.parse(req.body);
    
  const result = await db?.query(
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
       isonline   AS "isOnline",
       password
     FROM users
     WHERE username = $1 OR email = $1`,
    [usernameOrEmail]
  );

    const user = result?.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Remove password before sending
    delete user.password;
    
    res.json(user);
  } catch (error) {
    logger.error('Login error:', error);
    res.status(400).json({ error: 'Invalid request' });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const userData = registerSchema.parse(req.body);
    
    // Check existing user
    const existingUser = await db?.query(
      `SELECT * FROM users WHERE username = $1 OR email = $2`,
      [userData.username, userData.email]
    );

    if (existingUser?.rows.length) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // Create user
    const result = await db?.query(
      `INSERT INTO users (username, email, password, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, first_name, last_name, is_admin`,
      [userData.username, userData.email, hashedPassword, userData.firstName, userData.lastName]
    );

    res.status(201).json(result?.rows[0]);
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(400).json({ error: 'Invalid request' });
  }
});

export default router;
