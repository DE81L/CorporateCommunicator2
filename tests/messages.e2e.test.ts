// tests/messages.e2e.test.ts
import request from 'supertest';
import { createApp } from '../server/src/app';
import { connectDb, db } from '../server/src/db';

describe('Messaging E2E', () => {
  let app: Express.Application;

  beforeAll(async () => {
    app = createApp();
    await connectDb();
  });

  it('should send and store a message between users', async () => {
    // Register two users:
    await request(app).post('/api/auth/register').send({ username: 'user1', password: 'pass1' });
    await request(app).post('/api/auth/register').send({ username: 'user2', password: 'pass2' });

    // Log in both users (using different agents for sessions):
    const agent1 = request.agent(app);
    const agent2 = request.agent(app);

    await agent1.post('/api/auth/login').send({ username: 'user1', password: 'pass1' });
    await agent2.post('/api/auth/login').send({ username: 'user2', password: 'pass2' });

    // Get user IDs (assuming users are created with IDs 1 and 2, adjust if necessary)
    const user1Res = await db.query('SELECT id FROM users WHERE username = $1', ['user1']);
    const user2Res = await db.query('SELECT id FROM users WHERE username = $1', ['user2']);
    const user1Id = user1Res.rows[0].id;
    const user2Id = user2Res.rows[0].id;


    // Send a message from user1 to user2:
    const messageContent = 'Hello!';
    await agent1.post('/api/messages').send({ receiverId: user2Id, content: messageContent });

    // Verify the record in the database:
    const res = await db.query('SELECT sender_id, receiver_id, content FROM messages WHERE sender_id = $1 AND receiver_id = $2 AND content = $3', [user1Id, user2Id, messageContent]);

    expect(res.rows).toHaveLength(1);
    expect(res.rows[0]).toMatchObject({
      sender_id: user1Id,
      receiver_id: user2Id,
      content: messageContent
    });
  });
});