import dotenv from 'dotenv';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Load environment variables
dotenv.config();

// Environment detectiona
const isElectron = process.env.ELECTRON === 'true';
const isReplit = process.env.REPLIT_DB_URL !== undefined;

/**
 * Configure database connection based on environment
 */

const url = process.env.POSTGRES_URL;
if (!url) {
  throw new Error('POSTGRES_URL is not set');
}
const { Pool } = pg;
export const pool = new Pool({ connectionString: url, });


const connection = postgres(url, { max: 1 });
export const db = drizzle(connection, { schema });

async function checkDatabaseAndUser(): Promise<boolean> {
    try {
    // 1. Verify database connection (a simple query should suffice)
    await db.execute(sql`SELECT 1`); // Execute a trivial query

    // 2. Check for the specific user (adapt the query to your schema)
    const user = await db.query.users.findFirst({
      // Assuming you have a users table in your schema
      where: (users, { eq }) => eq(users.id, 1), // Adjust the where clause as needed
    });
    if (
      user &&
      user.username === 'est' &&
      user.email === 'a.a@a.com' &&
      // Add other attribute checks as needed (adjust column names!)
      user.firstname === 'a' &&
      user.lastname === 'a' &&
      user.isOnline === 0 && // Assuming isOnline is 0/1
      user.avatarurl === '__NULL_VALUE_7f9c2b3a4e'
    ) {
      console.log('Database connected and user exists!');
      return true;
    } else {
      console.log('Database connected, but user not found or data mismatch.');
      return false;
    }
  } catch (error) {
    console.error('Database connection or check failed:', error);


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
    // Test connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();

    console.log('✅ Connected to PostgreSQL database');
    console.log(`Database time: ${result.rows[0].now}`);
    
   
    
    // Log environment-specific database info
    if (isElectron) {
      console.log('Using local database configuration for Electron');
    } else if (isReplit) {      
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

export async function checkDatabaseUser(): Promise<boolean> {
  console.log("Function 'checkDatabaseUser' called")
  try {
    // 2. Check for the specific user (adapt the query to your schema)
    const user = await db.query.users.findFirst({
      // Assuming you have a users table in your schema
      where: (users, { eq }) => eq(users.id, 1) // Adjust the where clause as needed
    });
    if (
      user &&
      user.username === 'est' &&
      user.email === 'a.a@a.com' &&
      // Add other attribute checks as needed (adjust column names!)
      user.firstname === 'a' &&
      user.lastname === 'a' &&
      user.isOnline === 0 && // Assuming isOnline is 0/1
      user.avatarurl === '__NULL_VALUE_7f9c2b3a4e'
    ) {
      console.log('Database connected and user exists!');
      return true;
    } else {
      console.log('Database connected, but user not found or data mismatch.');
      return false;
    }
  } catch (error) {
    console.error('Database connection or check failed:', error);
    return false;
  }
}

/**
 * Helper function to generate incremental IDs for in-memory collections
 */
export function getNextId(collection: Map<number, any>): number {
  console.log("Function 'getNextId' called");
  return collection.size > 0 ? Math.max(...collection.keys()) + 1 : 1;
}