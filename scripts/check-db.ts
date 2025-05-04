import postgres from 'postgres';

async function checkDb() {
  let sql: postgres.Sql<{}> | undefined;
  try {
    console.log('Attempting to connect to the database...');
    // Use environment variables or a configuration file to store your database credentials
    // For example, you might use 'process.env.DATABASE_URL' here.
    // Replace with your actual database URL or connection configuration.
    const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/mess';
    sql = postgres(databaseUrl);

    const result = await sql`select current_timestamp`;
    console.log('✅ Connected to PostgreSQL database');
    console.log('Database time:', result[0].current_timestamp);

    // Check for the "lastname" column in the "users" table
    try {
      console.log('Checking for the "lastname" column...');
      await sql`SELECT last_name FROM users LIMIT 1`;
      console.log('✅ "lastname" column exists in "users" table.');
    } catch (error: any) {
      console.error('❌ Error: "lastname" column does not exist in "users" table.', error.message);
      process.exit(1);
    }

    // Check if the "groups" table exists
    const groupsTableExists = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'groups';`;
    if (groupsTableExists.length > 0) {
      console.log('✅ The "groups" table exists.');
    } else {
      console.error('❌ Error: The "groups" table does not exist.');
      process.exit(1);
    }

    // Check if the "messages" table exists
    const messagesTableExists = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'messages';`;
    if (messagesTableExists.length > 0) {
      console.log('✅ The "messages" table exists.');
      process.exit(0); // Exit with success code only if all checks pass
    } else {
      console.error('❌ Error: The "messages" table does not exist.');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Database connection or check failed:', error.message);
    process.exit(1);
  } finally {
    if (sql) {
      await sql.end(); // Close the connection in the finally block
    }
  }
}

checkDb();