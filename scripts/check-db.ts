import { db, connectToDb } from '../server/db';
import { sql } from 'drizzle-orm';

async function checkDb() {
  try {
    await connectToDb(); // Establish database connection

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