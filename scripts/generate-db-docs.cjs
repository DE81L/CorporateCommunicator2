#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DESCRIPTIONS = {
  announcements: 'Объявления для всех сотрудников',
  departments: 'Справочник отделов и подразделений',
  group_members: 'Связующая таблица пользователей и групп',
  groups: 'Групповые чаты и каналы',
  jobs: 'Должности сотрудников',
  messages: 'Чат-сообщения',
  requests: 'Заявки от пользователей',
  subdivisions: 'Структура подразделений',
  tasks_catalog: 'Список типов задач',
  users: 'Пользователи системы',
  wiki_categories: 'Категории wiki',
  wiki_entries: 'Статьи wiki'
};

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ Не задана переменная DATABASE_URL');
    process.exit(1);
  }
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  const tables = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
     ORDER BY table_name`
  );

  let md = '# Структура базы данных\n\n';
  md += 'Этот файл генерируется автоматически командой `pnpm run db:docs`.\n\n';

  const links = [];

  for (const { table_name } of tables.rows) {
    md += `## ${table_name}\n\n`;
    if (DESCRIPTIONS[table_name]) {
      md += `${DESCRIPTIONS[table_name]}\n\n`;
    }

    const cols = await client.query(
      `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns
         WHERE table_schema='public' AND table_name=$1
         ORDER BY ordinal_position`,
      [table_name]
    );

    md += '| Поле | Тип | Ограничения | По умолчанию |\n';
    md += '|------|-----|-------------|--------------|\n';
    for (const c of cols.rows) {
      const constraints = c.is_nullable === 'NO' ? 'NOT NULL' : '';
      md += `| ${c.column_name} | ${c.data_type} | ${constraints} | ${c.column_default || ''} |\n`;
    }

    const pk = await client.query(
      `SELECT a.attname AS col
         FROM pg_index i
         JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
         WHERE i.indrelid = $1::regclass AND i.indisprimary`,
      [table_name]
    );
    if (pk.rows.length) {
      md += `\n**PK:** ${pk.rows.map(r => r.col).join(', ')}\n`;
    }

    const fk = await client.query(
      `SELECT
         kcu.column_name AS column_name,
         ccu.table_name AS foreign_table,
         ccu.column_name AS foreign_column
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
       JOIN information_schema.constraint_column_usage ccu
         ON ccu.constraint_name = tc.constraint_name
         AND ccu.table_schema = tc.table_schema
       WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name=$1`,
      [table_name]
    );
    if (fk.rows.length) {
      md += '\n**FK:**\n';
      for (const row of fk.rows) {
        md += `- ${row.column_name} → ${row.foreign_table}.${row.foreign_column}\n`;
        links.push(`${table_name}.${row.column_name} -> ${row.foreign_table}.${row.foreign_column}`);
      }
    }

    md += '\n';
  }

  if (links.length) {
    md += '## Связи между таблицами\n\n';
    for (const l of links) md += `- ${l}\n`;
  }

  await client.end();
  fs.writeFileSync(path.join(__dirname, '..', 'docs', 'database_structure.md'), md, 'utf8');
  console.log('✓ database_structure.md обновлён');
}

main().catch(err => {
  console.error('Ошибка генерации документации:', err);
  process.exit(1);
});
