#!/usr/bin/env node
require('dotenv').config();
const { Client } = require('pg');

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('❌ DATABASE_URL env var not set');
  process.exit(1);
}

const tasks = [
  { id: 1, name: 'Не работает принтер', category: 'hardware' },
  { id: 2, name: 'Нет интернета', category: 'network' },
  { id: 3, name: 'Не работает проектор', category: 'hardware' },
  { id: 4, name: 'Другое', category: 'other' },
  { id: 5, name: 'Компьютер не включается', category: 'hardware' },
  { id: 6, name: 'Нужна настройка ПО', category: 'software' },
  { id: 7, name: 'Заменить картридж', category: 'hardware' },
  { id: 8, name: 'Установить ПО', category: 'software' },
];

(async () => {
  const client = new Client({ connectionString: DB_URL });
  try {
    await client.connect();
    for (const t of tasks) {
      const { rowCount } = await client.query('SELECT 1 FROM tasks_catalog WHERE id = $1', [t.id]);
      if (rowCount === 0) {
        await client.query('INSERT INTO tasks_catalog(id, name, category) VALUES($1,$2,$3)', [t.id, t.name, t.category]);
        console.log(`✓ inserted task ${t.name}`);
      } else {
        console.log(`→ task ${t.id} already exists`);
      }
    }
  } catch (err) {
    console.error('❌ failed to seed tasks:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
