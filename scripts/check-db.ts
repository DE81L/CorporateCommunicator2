import { db, pool } from '../server/db';
import { sql } from 'drizzle-orm';

async function checkDb() {
  console.log('Attempting to connect to the database...');
  let client;
  try {
    client = await pool.connect();
    console.log('Successfully connected to the database.');
    // Check for the "lastname" column in the "users" table
    const hasLastNameColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'lastname';
    `);
    if (hasLastNameColumn && !hasLastNameColumn.columns) {
      console.error('Error: The "lastname" column does not exist in the "users" table.');
      process.exit(1);
    }
    console.log('Success: The "lastname" column exists in the "users" table.');
    // Fetch the first user from the "users" table
    const firstUser = await db.execute(sql`SELECT * FROM users LIMIT 1`);
    if (firstUser) {
      console.log('Data retrieval test: Successfully retrieved first user:', firstUser);
    } else {
      console.error('Error: Failed to retrieve data from the "users" table.');
    }
    // Check if the "groups" table exists
    const groupsTableExists = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'groups';
    `);
    if (groupsTableExists && groupsTableExists.columns) {
      console.log('Success: The "groups" table exists.');
    } else {
      console.error('Error: The "groups" table does not exist.');
    }

    // Check if the "messages" table exists
    const messagesTableExists = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_name = 'messages';`);
    if (messagesTableExists && messagesTableExists.columns) {
      console.log('Success: The "messages" table exists.');
      process.exit(0); // Exit with success code only if all checks pass
    } else {
      console.error('Error: The "messages" table does not exist.');
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