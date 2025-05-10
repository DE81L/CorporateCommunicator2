"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const debug_1 = __importDefault(require("debug"));
exports.logger = {
    app: (0, debug_1.default)('rest-express:app'),
    db: (0, debug_1.default)('rest-express:db'),
    http: (0, debug_1.default)('rest-express:http')
};
