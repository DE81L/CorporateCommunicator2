"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const logging_1 = require("./config/logging");
exports.app = (0, express_1.default)();
async function createApp() {
    // Request logging
    exports.app.use((0, morgan_1.default)('dev'));
    // Debug logging middleware
    exports.app.use((req, _res, next) => {
        logging_1.logger.http(`${req.method} ${req.url}`);
        next();
    });
    // Basic middleware
    exports.app.use;
}
