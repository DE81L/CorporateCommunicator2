"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
const log = (...args) => {
    if (process.env.LOG_LEVEL === 'debug') {
        console.log('[DEBUG]', ...args);
    }
};
exports.log = log;
