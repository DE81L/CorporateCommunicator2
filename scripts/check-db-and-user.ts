import postgres from 'postgres';

async function checkDbAndUser() {
  let sql: postgres.Sql<{}> | undefined;
  try {
    console.log("Function 'connectToDb' called");
    // Use environment variables or a configuration file to store your database credentials
    // For example, you might use 'process.env.DATABASE_URL' here.
    // Replace with your actual database URL or connection configuration.
    const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/mess';
    sql = postgres(databaseUrl);

    const result = await sql`select current_timestamp`;
    console.log('✅ Connected to PostgreSQL database');
    console.log('Database time:', result[0].current_timestamp);

    // Add a check for the 'lastname' column in the 'users' table
    try {
      console.log("Function 'checkDatabaseAndUser' called");
      await sql`SELECT lastname FROM users LIMIT 1`;
      console.log('✅ "lastname" column exists in "users" table.');
      process.exit(0); // Success, exit with code 0
    } catch (error: any) {
      const errorMessage = `❌ Error: "lastname" column does not exist in "users" table. ${error.message}`;
      console.error(errorMessage);
      process.exit(1); // Failure, exit with code 1
    }
  } catch (error: any) {
    const errorMessage = `❌ Database connection or check failed: ${error.message}`;
    console.error(errorMessage);
    process.exit(1); // Failure, exit with code 1
  } finally {
    if (sql) {
      await sql.end(); // Close the connection in the finally block
    }
  }
}

checkDbAndUser();