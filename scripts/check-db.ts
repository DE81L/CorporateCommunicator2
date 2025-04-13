import { db, pool } from '../server/db';
import { sql } from 'drizzle-orm';


async function checkDb() {
  console.log('Attempting to connect to the database...');
  let client;
  try {
    client = await pool.connect();
    console.log('Successfully connected to the database.');

    const hasLastNameColumn = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_name';`);
    if (hasLastNameColumn && hasLastNameColumn.rows.length > 0) {
      console.log('Success: The "last_name" column exists in the "users" table.');
      process.exit(0);
    } else {
      console.error(
        'Error: The "last_name" column does not exist in the "users" table.'
      );
      process.exit(1);
    }
  } catch (error) {
    console.error('Error checking database:', error);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
  }
}
checkDb();