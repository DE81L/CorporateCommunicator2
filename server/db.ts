import pg from "pg";
const { Pool } = pg;
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper function for queries
export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

// Keep this function but update it to check PostgreSQL connection
export async function connectToDb(): Promise<void> {
  try {
    await pool.connect();
    console.log("✅ Connected to PostgreSQL database");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    throw err;
  }
}

// Single declaration of getNextId
export function getNextId(collection: Map<number, any>): number {
  return Math.max(0, ...Array.from(collection.keys())) + 1;
}

// These lines are removed as they cause circular import issues
