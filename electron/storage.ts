import { ipcMain } from 'electron';
import ElectronStore from 'electron-store';
import { z } from 'zod';
  
// Define schemas for validation
interface StoreData {
  userData: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    settings?: {
      theme: 'light' | 'dark' | 'system';
      language: 'en' | 'ru';
      notifications: boolean;
      soundEnabled: boolean;
    };
  } | null;
  messages: Array<{
    id: number;
    senderId: number;
    receiverId: number;
    content: string;
    timestamp: number;
    type: 'text' | 'file' | 'image';
    status: 'sent' | 'delivered' | 'read';
    metadata?: Record<string, unknown>;
  }>;
  lastMessageId: number;
}


const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  settings: z.object({
    theme: z.enum(['light', 'dark', 'system']),
    language: z.enum(['en', 'ru']),
    notifications: z.boolean(),
    soundEnabled: z.boolean()
  }).optional()
});

const messageSchema = z.object({
  id: z.number(),
  senderId: z.number(),
  receiverId: z.number(),
  content: z.string(),
  timestamp: z.number(),
  type: z.enum(['text', 'file', 'image']),
  status: z.enum(['sent', 'delivered', 'read']),
  metadata: z.record(z.unknown()).optional()
});

const store: ElectronStore<StoreData> & {
  get: <Key extends keyof StoreData>(
    key: Key,
    defaultValue?: StoreData[Key]
  ) => StoreData[Key];
  set: <Key extends keyof StoreData>(
    key: Key,
    value: StoreData[Key]
  ) => void;
} = new ElectronStore<StoreData>({
  name: "nexus-data",
  defaults: {
    userData: null,
    messages: [],
    lastMessageId: 0,
  }
});

export function initStorage() {
  // Register IPC handlers
  ipcMain.handle('get-user-data', getUserData);
  ipcMain.handle('set-user-data', setUserData);
  ipcMain.handle('get-messages', getMessages);
  ipcMain.handle('save-message', saveMessage);
  ipcMain.handle('delete-message', deleteMessage);
}

async function getUserData() {
  try {
    const userData = store['get']('userData');
    if (!userData) return null;
    
    // Validate stored data
    const validatedData = userSchema.parse(userData);
    return validatedData;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}

async function setUserData(_event: Electron.IpcMainInvokeEvent, data: unknown) {
  try {
    // Validate input data
    const validatedData = userSchema.parse(data);
    
    // Store data
    store['set']('userData', validatedData);
    return { 
      success: true, 
      message: 'User data saved successfully' 
    };
  } catch (error) {
    console.error('Error setting user data:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to save user data' 
    };
  }
}

async function getMessages() {
  try {
    const messages = store['get']('messages', []);
    interface Message {
      id: number;
      senderId: number;
      receiverId: number;
      content: string;
      timestamp: number;
      type: 'text' | 'file' | 'image';
      status: 'sent' | 'delivered' | 'read';
      metadata?: Record<string, unknown>;
    }

    return (messages as unknown[]).map((msg: unknown): Message => messageSchema.parse(msg));
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
}

async function saveMessage(_event: Electron.IpcMainInvokeEvent, message: unknown) {
  try {
    // Validate message data
    const validatedMessage = messageSchema.parse({
      ...(message as object),
      id: store['get']('lastMessageId', 0) + 1,
      timestamp: Date.now()
    });

    // Get existing messages and append new one
    const messages = store['get']('messages', []);
    messages.push(validatedMessage);

    // Update store
    store['set']('messages', messages);
    store['set']('lastMessageId', validatedMessage.id);

    return {
      success: true,
      message: 'Message saved successfully',
      data: validatedMessage
    };
  } catch (error) {
    console.error('Error saving message:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to save message'
    };
  }
}

async function deleteMessage(_event: Electron.IpcMainInvokeEvent, id: number) {
  try {
    // Get current messages
    const messages = store['get']('messages', []);
    
    // Filter out the message to delete
    const newMessages = messages.filter((msg: any) => msg.id !== id);
    
    // Update store
    store['set']('messages', newMessages);

    return {
      success: true,
      message: 'Message deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting message:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete message'
    };
  }
}