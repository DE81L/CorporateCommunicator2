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

    // Determine default department and job IDs
    const { rows: dept } = await client.query(
      'SELECT id FROM departments ORDER BY id LIMIT 1'
    );
    const defaultDeptId = dept[0]?.id;
    if (!defaultDeptId) {
      throw new Error('No departments found');
    }

    let { rows: jobRows } = await client.query(
      'SELECT id FROM jobs ORDER BY id LIMIT 1'
    );
    let defaultJobId = jobRows[0]?.id;

    // Seed a placeholder job if table is empty
    if (!defaultJobId) {
      const ins = await client.query(
        'INSERT INTO jobs(name, department_id) VALUES($1,$2) RETURNING id',
        ['Default Job', defaultDeptId]
      );
      defaultJobId = ins.rows[0].id;
      console.log('✓ Created placeholder job');
    }

    // Map job_title to job_id where possible
    await client.query(
      `UPDATE users SET job_id = j.id
       FROM jobs j
       WHERE users.job_title = j.name AND users.job_id IS NULL`
    );

    // Fix invalid job_id values
    await client.query(
      `UPDATE users SET job_id = $1
       WHERE job_id IS NULL OR job_id NOT IN (SELECT id FROM jobs)`,
      [defaultJobId]
    );

    // Fix invalid department_id values
    await client.query(
      `UPDATE users SET department_id = $1
       WHERE department_id IS NULL OR department_id NOT IN (SELECT id FROM departments)`,
      [defaultDeptId]
    );

    // Ensure jobs have valid department_id
    await client.query(
      `UPDATE jobs SET department_id = $1
       WHERE department_id IS NULL OR department_id NOT IN (SELECT id FROM departments)`,
      [defaultDeptId]
    );

    console.log('✓ Normalized job and department references');
  } catch (err) {
    console.error('❌ Script failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
