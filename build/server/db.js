"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = void 0;
exports.connectDb = connectDb;
const pg_1 = require("pg");
const logger_1 = require("../util/logger");
let client = null;
exports.client = client;
async function connectDb() {
    if (!process.env.DATABASE_URL || process.env.DB_DISABLED === 'true') {
        (0, logger_1.log)('⏩ DB connection skipped');
        return;
    }
    try {
        exports.client = client = new pg_1.Client({ connectionString: process.env.DATABASE_URL });
        await client.connect();
        (0, logger_1.log)('✓ DB connected');
    }
    catch (error) {
        (0, logger_1.log)('⚠️ DB connection failed:', error);
        exports.client = client = null;
    }
}
