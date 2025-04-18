import postgres from 'postgres';

async function checkDbAndUser() {
    let sql: postgres.Sql<{}> | undefined;
    try {
        console.log("Function 'connectToDb' called");
        const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/mess';
        sql = postgres(databaseUrl);
        const result = await sql`select current_timestamp`;
        console.log('✅ Connected to PostgreSQL database');
        console.log('Database time:', result[0].current_timestamp);
        process.exit(0);
    } catch (error: any) {
        const errorMessage = `❌ Database connection failed: ${error.message}`;
        console.error(errorMessage);
        process.exit(1);
    } finally {
        if (sql) {
            await sql.end();
        }
    }
}

checkDbAndUser();