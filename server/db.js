"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.pool = void 0;
exports.query = query;
exports.connectToDb = connectToDb;
exports.getNextId = getNextId;
const pg_1 = __importDefault(require("pg"));
const { Pool } = pg_1.default;
const dotenv_1 = __importDefault(require("dotenv"));
const postgres_js_1 = require("drizzle-orm/postgres-js");
const postgres_1 = __importDefault(require("postgres"));
const schema = __importStar(require("../shared/electron-shared/schema"));
// Load environment variables
dotenv_1.default.config();
// Environment detection
const isElectron = process.env.ELECTRON === 'true';
const isReplit = process.env.REPLIT_DB_URL !== undefined;
/**
 * Configure database connection based on environment
 */
exports.pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
const connection = (0, postgres_1.default)(process.env.DATABASE_URL, { max: 1 });
exports.db = (0, postgres_js_1.drizzle)(connection, { schema });
/**
 * Execute a SQL query against the database
 */
async function query(text, params) {
    const start = Date.now();
    try {
        const res = await exports.pool.query(text, params);
        const duration = Date.now() - start;
        console.log(`Executed query in ${duration}ms`, { text, params });
        return res;
    }
    catch (err) {
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
        const client = await exports.pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Connected to PostgreSQL database');
        console.log(`Database time: ${result.rows[0].now}`);
        // Log environment-specific database info
        if (isElectron) {
            console.log('Using local database configuration for Electron');
        }
        else if (isReplit) {
            console.log('Using Replit database configuration');
        }
        else {
            console.log('Using standard web database configuration');
        }
        return;
    }
    catch (err) {
        console.error('Database connection error:', err);
        throw new Error(`Failed to connect to database: ${err instanceof Error ? err.message : String(err)}`);
    }
}
/**
 * Helper function to generate incremental IDs for in-memory collections
 */
function getNextId(collection) {
    return collection.size > 0 ? Math.max(...collection.keys()) + 1 : 1;
}
