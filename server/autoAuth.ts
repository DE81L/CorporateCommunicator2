import { Express, Request, Response } from 'express';
import { db } from "./db";
import { sql } from "drizzle-orm";
import * as schema from '@shared/electron-shared/schema';

export function setupAutoAuth(app: Express) {
  app.get('/api/random-user', async (req: Request, res: Response) => {
    try {
      const users = await db.select().from(schema.users).orderBy(sql`random()`).limit(1);
      
      if (users.length === 0) {
        return res.status(404).json({ message: 'No users found' });
      }
      const randomUser = users[0];
      console.log('/api/random-user');

      // Remove password from response
      const userObj = randomUser as { [key: string]: any };
      const { password, ...userWithoutPassword } = userObj;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get random user', error });
    } finally {
      console.log('/api/random-user');
    }
  });
}