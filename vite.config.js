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
const vite_1 = require("vite");
const plugin_react_1 = __importDefault(require("@vitejs/plugin-react"));
const path_1 = __importStar(require("path"));
const url_1 = require("url");
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = (0, path_1.dirname)(__filename);
exports.default = (0, vite_1.defineConfig)(({ mode }) => {
    const env = (0, vite_1.loadEnv)(mode, process.cwd(), '');
    return {
        plugins: [(0, plugin_react_1.default)()],
        base: './',
        define: {
            'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
        },
        resolve: {
            alias: {
                "@": path_1.default.resolve(__dirname, "client/src"),
                "@shared": "./shared",
                "@assets": path_1.default.resolve(__dirname, "attached_assets"),
            },
        },
        root: path_1.default.resolve(__dirname, "client"),
        build: {
            outDir: path_1.default.resolve(__dirname, "dist/public"),
            assetsDir: "assets",
            emptyOutDir: true,
        },
        server: {
            port: 5173,
            strictPort: true,
            proxy: {
                '/api': {
                    target: env.VITE_API_URL || 'http://localhost:3000',
                    changeOrigin: true,
                }
            }
        },
        publicDir: "client/public",
    };
});
