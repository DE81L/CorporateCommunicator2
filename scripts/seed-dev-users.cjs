#!/usr/bin/env node

require("dotenv").config();
const bcrypt = require("bcrypt");
const { Client } = require("pg");

const SALT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;
const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("❌ Не задана переменная DATABASE_URL");
  process.exit(1);
}

const seed = [
  {
    username: "admin",
    email: "admin@example.com",
    password: "admin123",
    firstName: "Super",
    lastName: "Admin",
    is_admin: true,
  },
  {
    username: "john",
    email: "john@example.com",
    password: "password",
    firstName: "John",
    lastName: "Doe",
    is_admin: false,
  },
];

(async () => {
  const client = new Client({ connectionString: DB_URL });
  try {
    await client.connect();
    for (const u of seed) {
      // Проверяем, есть ли уже пользователь с таким email
      const { rowCount } = await client.query(
        "SELECT 1 FROM users WHERE email = $1",
        [u.email]
      );
      if (rowCount > 0) {
        console.log(`→ пропускаем ${u.username}, email уже занят`);
        continue;
      }
      // Хешируем и вставляем
      const hash = await bcrypt.hash(u.password, SALT_ROUNDS);
      await client.query(
        `INSERT INTO users
           (username, email, password, first_name, last_name, is_admin)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [u.username, u.email, hash, u.firstName, u.lastName, u.is_admin]
      );
      console.log(`✓ seeded ${u.username}`);
    }
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
