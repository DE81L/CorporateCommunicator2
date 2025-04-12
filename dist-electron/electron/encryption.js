"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initEncryption = initEncryption;
const electron_1 = require("electron");
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Key store configuration
const KEY_STORE_PATH = path_1.default.join(process.env.APPDATA || process.env.HOME || "./", "NexusMessaging", "keys");
// Encryption constants
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_ALGORITHM = 'rsa';
const KEY_LENGTH = 2048;
const KEY_FORMAT = 'pem';
function initEncryption() {
    // Ensure key store directory exists
    if (!fs_1.default.existsSync(KEY_STORE_PATH)) {
        fs_1.default.mkdirSync(KEY_STORE_PATH, { recursive: true });
    }
    // Register IPC handlers
    electron_1.ipcMain.handle("generate-key-pair", generateKeyPair);
    electron_1.ipcMain.handle("encrypt-message", encryptMessage);
    electron_1.ipcMain.handle("decrypt-message", decryptMessage);
    electron_1.ipcMain.handle("get-public-key", getPublicKey);
    electron_1.ipcMain.handle("rotate-keys", rotateKeys);
}
async function generateKeyPair() {
    try {
        const { publicKey, privateKey } = crypto_1.default.generateKeyPairSync(KEY_ALGORITHM, {
            modulusLength: KEY_LENGTH,
            publicKeyEncoding: {
                type: 'spki',
                format: KEY_FORMAT
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: KEY_FORMAT
            }
        });
        // Save keys
        fs_1.default.writeFileSync(path_1.default.join(KEY_STORE_PATH, 'public.pem'), publicKey);
        fs_1.default.writeFileSync(path_1.default.join(KEY_STORE_PATH, 'private.pem'), privateKey);
        return {
            success: true,
            message: "Key pair generated successfully"
        };
    }
    catch (error) {
        console.error('Error generating key pair:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to generate key pair"
        };
    }
}
async function encryptMessage(_event, message, publicKey) {
    try {
        // Generate a random symmetric key and IV
        const symmetricKey = crypto_1.default.randomBytes(32);
        const iv = crypto_1.default.randomBytes(12);
        // Encrypt the message with the symmetric key
        const cipher = crypto_1.default.createCipheriv(ENCRYPTION_ALGORITHM, symmetricKey, iv);
        let encryptedMessage = cipher.update(message, 'utf8', 'base64');
        encryptedMessage += cipher.final('base64');
        const authTag = cipher.getAuthTag();
        // Encrypt the symmetric key with the recipient's public key
        const encryptedKey = crypto_1.default.publicEncrypt(publicKey, symmetricKey);
        // Combine all components
        return JSON.stringify({
            encryptedMessage,
            encryptedKey: encryptedKey.toString('base64'),
            iv: iv.toString('base64'),
            authTag: authTag.toString('base64')
        });
    }
    catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt message');
    }
}
async function decryptMessage(_event, encryptedData) {
    try {
        const { encryptedMessage, encryptedKey, iv, authTag } = JSON.parse(encryptedData);
        const privateKey = fs_1.default.readFileSync(path_1.default.join(KEY_STORE_PATH, 'private.pem'));
        // Decrypt the symmetric key
        const symmetricKey = crypto_1.default.privateDecrypt(privateKey, Buffer.from(encryptedKey, 'base64'));
        // Decrypt the message
        const decipher = crypto_1.default.createDecipheriv(ENCRYPTION_ALGORITHM, symmetricKey, Buffer.from(iv, 'base64'));
        decipher.setAuthTag(Buffer.from(authTag, 'base64'));
        let decrypted = decipher.update(encryptedMessage, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt message');
    }
}
async function getPublicKey(_event) {
    try {
        const publicKey = fs_1.default.readFileSync(path_1.default.join(KEY_STORE_PATH, 'public.pem'), 'utf8');
        return publicKey;
    }
    catch (error) {
        console.error('Error getting public key:', error);
        return '';
    }
}
async function rotateKeys(_event) {
    try {
        // Backup existing keys
        const timestamp = Date.now();
        const backupDir = path_1.default.join(KEY_STORE_PATH, `backup-${timestamp}`);
        fs_1.default.mkdirSync(backupDir, { recursive: true });
        if (fs_1.default.existsSync(path_1.default.join(KEY_STORE_PATH, 'public.pem'))) {
            fs_1.default.renameSync(path_1.default.join(KEY_STORE_PATH, 'public.pem'), path_1.default.join(backupDir, 'public.pem'));
        }
        if (fs_1.default.existsSync(path_1.default.join(KEY_STORE_PATH, 'private.pem'))) {
            fs_1.default.renameSync(path_1.default.join(KEY_STORE_PATH, 'private.pem'), path_1.default.join(backupDir, 'private.pem'));
        }
        // Generate new keys
        return await generateKeyPair();
    }
    catch (error) {
        console.error('Error rotating keys:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to rotate keys"
        };
    }
}
