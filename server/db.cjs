const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Environment detection
const isElectron = process.env.ELECTRON === 'true';
const isReplit = process.env.REPLIT_DB_URL !== undefined;

/**
 * Configure database connection based on environment
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isReplit ? { rejectUnauthorized: false } : undefined,
});

/**
 * Execute a SQL query against the database
 */
async function query(text, params) {
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
async function connectToDb() {
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

/**
 * Helper function to generate incremental IDs for in-memory collections
 */
function getNextId(collection) {
  if (collection.size > 0) {
    return Math.max(...Array.from(collection.keys())) + 1;
  }
  return 1;
}

module.exports = {
  pool,
  query,
  connectToDb,
  getNextId
};