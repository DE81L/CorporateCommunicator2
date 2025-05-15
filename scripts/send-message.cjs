#!/usr/bin/env node

require('dotenv').config();

const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const [fromUser, toUser, ...textParts] = process.argv.slice(2);
const content = textParts.join(' ');

(async () => {
  if (!fromUser || !toUser || !content) {
    console.error('Usage: node send-message.cjs <fromUsername> <toUsername> <text>');
    process.exit(1);
  }

  try {
    // Find sender and receiver user IDs by username:
    const senderResult = await pool.query('SELECT id FROM users WHERE username = $1', [fromUser]);
    const sender = senderResult.rows[0];

    const receiverResult = await pool.query('SELECT id FROM users WHERE username = $1', [toUser]);
    const receiver = receiverResult.rows[0];

    if (!sender || !receiver) {
      console.error('One or both users not found.');
      process.exit(1);
    }

    // Insert the message into the messages table:
    await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3)`,
      [sender.id, receiver.id, content]
    );

    console.log(`Message from ${fromUser} to ${toUser} saved.`);
    process.exit(0);

  } catch (error) {
    console.error('Error sending message:', error);
    process.exit(1);
  } finally {
    pool.end();
  }
})();