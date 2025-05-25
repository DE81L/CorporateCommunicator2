import bcrypt from 'bcrypt';
import { db } from '../../db';
import { logger } from '@shared/logger';

export async function login(usernameOrEmail: string, password: string) {
  const result = await db?.query(
    `SELECT
       id,
       username,
       email,
       password,
       first_name AS "firstName",
       last_name  AS "lastName",
       job_id     AS "jobId",
       job_title  AS "jobTitle",
       avatarurl  AS "avatarUrl",
       is_admin   AS "isAdmin",
       isonline   AS "isOnline"
     FROM users
     WHERE username = $1 OR email = $1`,
    [usernameOrEmail]
  );

  const user = result?.rows[0];
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw new Error('Invalid credentials');
  }

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function register(userData: {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isAdmin?: boolean;
}) {
  // Check if username or email already exist to return a proper error
  const existing = await db?.query(
    'SELECT id FROM users WHERE username = $1 OR email = $2',
    [userData.username, userData.email]
  );
  if (existing && (existing.rowCount ?? 0) > 0) {
    const err = new Error('User already exists');
    // Attach custom code so the route can map to 409 status
    (err as any).code = 'DUPLICATE';
    throw err;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);

  const result = await db?.query(
    `INSERT INTO users (username, email, password, first_name, last_name, is_admin)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, username, email, first_name, last_name, is_admin AS "isAdmin"`,
    [
      userData.username,
      userData.email,
      hashedPassword,
      userData.firstName,
      userData.lastName,
      userData.isAdmin ? 1 : 0,
    ]
  );

  return result?.rows[0];
}
