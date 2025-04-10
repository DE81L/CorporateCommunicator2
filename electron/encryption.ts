import { ipcMain } from "electron";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// Key store configuration
const KEY_STORE_PATH = path.join(
  process.env.APPDATA || process.env.HOME || "./",
  "NexusMessaging",
  "keys"
);

// Encryption constants
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_ALGORITHM = 'rsa';
const KEY_LENGTH = 2048;
const KEY_FORMAT = 'pem';

export function initEncryption() {
  // Ensure key store directory exists
  if (!fs.existsSync(KEY_STORE_PATH)) {
    fs.mkdirSync(KEY_STORE_PATH, { recursive: true });
  }

  // Register IPC handlers
  ipcMain.handle("generate-key-pair", generateKeyPair);
  ipcMain.handle("encrypt-message", encryptMessage);
  ipcMain.handle("decrypt-message", decryptMessage);
  ipcMain.handle("get-public-key", getPublicKey);
  ipcMain.handle("rotate-keys", rotateKeys);
}

async function generateKeyPair() {
  try {
    const { publicKey, privateKey } = crypto.generateKeyPairSync(KEY_ALGORITHM, {
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
    fs.writeFileSync(path.join(KEY_STORE_PATH, 'public.pem'), publicKey);
    fs.writeFileSync(path.join(KEY_STORE_PATH, 'private.pem'), privateKey);

    return { 
      success: true, 
      message: "Key pair generated successfully" 
    };
  } catch (error) {
    console.error('Error generating key pair:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to generate key pair" 
    };
  }
}

async function encryptMessage(
  _event: Electron.IpcMainInvokeEvent,
  message: string,
  publicKey: string
) {
  try {
    // Generate a random symmetric key and IV
    const symmetricKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);

    // Encrypt the message with the symmetric key
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, symmetricKey, iv);
    let encryptedMessage = cipher.update(message, 'utf8', 'base64');
    encryptedMessage += cipher.final('base64');
    const authTag = cipher.getAuthTag();

    // Encrypt the symmetric key with the recipient's public key
    const encryptedKey = crypto.publicEncrypt(
      publicKey,
      symmetricKey
    );

    // Combine all components
    return JSON.stringify({
      encryptedMessage,
      encryptedKey: encryptedKey.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64')
    });
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
}

async function decryptMessage(
  _event: Electron.IpcMainInvokeEvent,
  encryptedData: string
) {
  try {
    const { encryptedMessage, encryptedKey, iv, authTag } = JSON.parse(encryptedData);
    const privateKey = fs.readFileSync(path.join(KEY_STORE_PATH, 'private.pem'));

    // Decrypt the symmetric key
    const symmetricKey = crypto.privateDecrypt(
      privateKey,
      Buffer.from(encryptedKey, 'base64')
    );

    // Decrypt the message
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      symmetricKey,
      Buffer.from(iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));

    let decrypted = decipher.update(encryptedMessage, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
}

async function getPublicKey(_event: Electron.IpcMainInvokeEvent) {
  try {
    const publicKey = fs.readFileSync(path.join(KEY_STORE_PATH, 'public.pem'), 'utf8');
    return publicKey;
  } catch (error) {
    console.error('Error getting public key:', error);
    return '';
  }
}

async function rotateKeys(_event: Electron.IpcMainInvokeEvent) {
  try {
    // Backup existing keys
    const timestamp = Date.now();
    const backupDir = path.join(KEY_STORE_PATH, `backup-${timestamp}`);
    fs.mkdirSync(backupDir, { recursive: true });

    if (fs.existsSync(path.join(KEY_STORE_PATH, 'public.pem'))) {
      fs.renameSync(
        path.join(KEY_STORE_PATH, 'public.pem'),
        path.join(backupDir, 'public.pem')
      );
    }
    if (fs.existsSync(path.join(KEY_STORE_PATH, 'private.pem'))) {
      fs.renameSync(
        path.join(KEY_STORE_PATH, 'private.pem'),
        path.join(backupDir, 'private.pem')
      );
    }

    // Generate new keys
    return await generateKeyPair();
  } catch (error) {
    console.error('Error rotating keys:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to rotate keys" 
    };
  }
}
