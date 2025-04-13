import { db, pool } from '../server/db';
import { sql } from 'drizzle-orm';

async function checkDb() {
  try {
    // Establish database connection using the pool directly
    const client = await pool.connect();
    await client.query('SELECT 1'); // Simple query to check connection
    client.release();
    
    console.log('Connected to the database for check.')
    
    const hasLastNameColumn = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_name';`);
    if (hasLastNameColumn.rows.length === 0) {
      console.error('Error: The "last_name" column does not exist in the "users" table.');
      process.exit(1);
    } else {
      console.log('Success: The "last_name" column exists in the "users" table.');
      process.exit(0);
    }
  } catch (error) {
    console.error('Error checking database:', error);
    process.exit(1);
  }
}

checkDb();