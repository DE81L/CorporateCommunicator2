import dotenv from 'dotenv';
import * as pg from 'pg';
const { Pool } = pg;
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../shared/electron-shared/schema';

// Load environment variables
dotenv.config();

const url = process.env.POSTGRES_URL!;
if (!url) {
  throw new Error('POSTGRES_URL is not set');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const connection = postgres(url, { max: 1 });
export const db = drizzle(connection, { schema });

export async function checkDatabaseAndUser(): Promise<boolean> {
  try {
    // 1. Verify database connection (a simple query should suffice)
    await db.execute(sql`SELECT 1`); // Execute a trivial query
    console.log('Database connected!');
    return true; // Indicate success if the connection is established
  } catch (error) {
    console.error('Database connection or check failed:', error);
    return false;
  }
}

/**
 * Check if a column exists in a table
 */
export async function checkColumnExists(
  tableName: string,
  columnName: string,
): Promise<boolean> {
  console.log(`Checking if column '${columnName}' exists in table '${tableName}'`);
  try {
    const rows = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = ${tableName} AND column_name = ${columnName};
    `) as { exists: number }[];
    return rows.length > 0;
  } catch (error) {
    console.error(`Error checking column existence:`, error);
    return false;
  }
}

/**
 * Execute a SQL query against the database
 */
export async function query(text: string, params?: any[]) {
  console.log("Function 'query' called");
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`Executed query in ${duration}ms`, { text, params });
    return res;
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  }
}

/**
 * Connect to the database and verify connection
 */
export async function connectToDb(): Promise<void> {
  console.log("Function 'connectToDb' called");
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL database');
    console.log(`Database time: ${result.rows[0].now}`);

    // Log environment-specific database info
    if (process.env.ELECTRON === 'true') {
      console.log('Using local database configuration for Electron');
    } else if (process.env.REPLIT_DB_URL !== undefined) {
      console.log('Using Replit database configuration');
    } else {
      console.log('Using standard web database configuration');
    }

    return;
  } catch (err) {
    console.error('Database connection error:', err);
    throw new Error(`Failed to connect to database: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Helper function to generate incremental IDs for in-memory collections
 */
export function getNextId(collection: Map<number, any>): number {
  console.log("Function 'getNextId' called");
  return collection.size > 0 ? Math.max(...collection.keys()) + 1 : 1;
}