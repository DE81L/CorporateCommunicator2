#!/usr/bin/env node

require("dotenv").config();
const bcrypt = require("bcrypt");
const { Client } = require("pg");

const ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;
const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("❌ Не задана переменная DATABASE_URL в .env");
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString: DB_URL });
  try {
    await client.connect();
    const { rows } = await client.query("SELECT id, password FROM users");
    for (const { id, password } of rows) {
      if (password.startsWith("$2a$") || password.startsWith("$2b$") || password.startsWith("$2y$"))
        continue;
      const newHash = await bcrypt.hash(password, ROUNDS);
      await client.query("UPDATE users SET password = $1 WHERE id = $2", [newHash, id]);
      console.log(`✓ user ${id} re-hashed`);
    }
  } catch (err) {
    console.error("Ошибка во время rehash:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
