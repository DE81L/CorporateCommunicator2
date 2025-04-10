"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initStorage = initStorage;
const electron_1 = require("electron");
const electron_store_1 = __importDefault(require("electron-store"));
const zod_1 = require("zod");
// Define schemas for validation
const userSchema = zod_1.z.object({
    id: zod_1.z.number(),
    username: zod_1.z.string(),
    firstName: zod_1.z.string(),
    lastName: zod_1.z.string(),
    email: zod_1.z.string().email(),
    settings: zod_1.z.object({
        theme: zod_1.z.enum(['light', 'dark', 'system']),
        language: zod_1.z.enum(['en', 'ru']),
        notifications: zod_1.z.boolean(),
        soundEnabled: zod_1.z.boolean()
    }).optional()
});
const messageSchema = zod_1.z.object({
    id: zod_1.z.number(),
    senderId: zod_1.z.number(),
    receiverId: zod_1.z.number(),
    content: zod_1.z.string(),
    timestamp: zod_1.z.number(),
    type: zod_1.z.enum(['text', 'file', 'image']),
    status: zod_1.z.enum(['sent', 'delivered', 'read']),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional()
});
// Initialize electron-store
const store = new electron_store_1.default({
    name: 'nexus-data',
    defaults: {
        userData: null,
        messages: [],
        lastMessageId: 0
    }
});
function initStorage() {
    // Register IPC handlers
    electron_1.ipcMain.handle('get-user-data', getUserData);
    electron_1.ipcMain.handle('set-user-data', setUserData);
    electron_1.ipcMain.handle('get-messages', getMessages);
    electron_1.ipcMain.handle('save-message', saveMessage);
    electron_1.ipcMain.handle('delete-message', deleteMessage);
}
async function getUserData() {
    try {
        const userData = store.get('userData');
        if (!userData)
            return null;
        // Validate stored data
        const validatedData = userSchema.parse(userData);
        return validatedData;
    }
    catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
}
async function setUserData(_event, data) {
    try {
        // Validate input data
        const validatedData = userSchema.parse(data);
        // Store data
        store.set('userData', validatedData);
        return {
            success: true,
            message: 'User data saved successfully'
        };
    }
    catch (error) {
        console.error('Error setting user data:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to save user data'
        };
    }
}
async function getMessages() {
    try {
        const messages = store.get('messages', []);
        return messages.map((msg) => messageSchema.parse(msg));
    }
    catch (error) {
        console.error('Error getting messages:', error);
        return [];
    }
}
async function saveMessage(_event, message) {
    try {
        // Validate message data
        const validatedMessage = messageSchema.parse({
            ...message,
            id: store.get('lastMessageId', 0) + 1,
            timestamp: Date.now()
        });
        // Get existing messages and append new one
        const messages = store.get('messages', []);
        messages.push(validatedMessage);
        // Update store
        store.set('messages', messages);
        store.set('lastMessageId', validatedMessage.id);
        return {
            success: true,
            message: 'Message saved successfully',
            data: validatedMessage
        };
    }
    catch (error) {
        console.error('Error saving message:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to save message'
        };
    }
}
async function deleteMessage(_event, id) {
    try {
        // Get current messages
        const messages = store.get('messages', []);
        // Filter out the message to delete
        const newMessages = messages.filter((msg) => msg.id !== id);
        // Update store
        store.set('messages', newMessages);
        return {
            success: true,
            message: 'Message deleted successfully'
        };
    }
    catch (error) {
        console.error('Error deleting message:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to delete message'
        };
    }
}
