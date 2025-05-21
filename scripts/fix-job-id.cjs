#!/usr/bin/env node

require('dotenv').config();
const { Client } = require('pg');

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('❌ DATABASE_URL env var not set');
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString: DB_URL });
  try {
    await client.connect();
    // Check if job_id column exists
    const { rowCount } = await client.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_name = 'users' AND column_name = 'job_id'`
    );
    if (rowCount === 0) {
      await client.query(
        "ALTER TABLE users ADD COLUMN job_id integer REFERENCES jobs(id)"
      );
      console.log('✓ Added job_id column to users');
    } else {
      console.log('→ job_id column already exists');
    }

    // Seed jobs table if empty
    const jobCount = await client.query('SELECT COUNT(*) FROM jobs');
    if (Number(jobCount.rows[0].count) === 0) {
      await client.query(
        `INSERT INTO jobs (name, department_id) VALUES
         ('Recruiter', 1),
         ('Software Engineer', 2)`
      );
      console.log('✓ Seeded default jobs');
    } else {
      console.log('→ jobs table already populated');
    }

    // Update users.job_id based on job_title
    await client.query(
      `UPDATE users SET job_id = j.id
       FROM jobs j
       WHERE users.job_title = j.name AND users.job_id IS NULL`
    );
    console.log('✓ Updated users.job_id values');
  } catch (err) {
    console.error('❌ Script failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
