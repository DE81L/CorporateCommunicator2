import bcrypt from 'bcrypt';
import { db } from '../../db';
import { logger } from '@shared/logger';

export async function login(usernameOrEmail: string, password: string) {
  const result = await db?.query(
    `SELECT * FROM users WHERE username = $1 OR email = $1`,
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
}) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);

  const result = await db?.query(
    `INSERT INTO users (username, email, password, first_name, last_name)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, username, email, first_name, last_name`,
    [userData.username, userData.email, hashedPassword, userData.firstName, userData.lastName]
  );

  return result?.rows[0];
}
