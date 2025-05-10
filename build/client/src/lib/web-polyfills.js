"use strict";
/**
 * Web Polyfills for Electron API
 *
 * This file provides web-friendly alternatives to Electron-specific functionality.
 * Used when the application is running in a browser environment (e.g., Replit).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ipcRenderer = exports.clipboard = exports.system = exports.dialog = exports.fileSystem = void 0;
exports.installMockElectronAPI = installMockElectronAPI;
// File system operations
exports.fileSystem = {
    // Read file - uses IndexedDB in web environment
    readFile: async (filePath) => {
        // In web, we'd use IndexedDB or localStorage - simplified example:
        const storedData = localStorage.getItem(`file:${filePath}`);
        if (!storedData) {
            throw new Error(`File not found: ${filePath}`);
        }
        return storedData;
    },
    // Write file - uses IndexedDB in web environment
    writeFile: async (filePath, data) => {
        // In web, we'd use IndexedDB or localStorage - simplified example:
        localStorage.setItem(`file:${filePath}`, data);
        return;
    },
    // Check if file exists - uses IndexedDB in web environment
    fileExists: async (filePath) => {
        // In web, we'd use IndexedDB or localStorage - simplified example:
        return localStorage.getItem(`file:${filePath}`) !== null;
    }
};
// Dialog operations
exports.dialog = {
    // Show open dialog - uses file input in web environment
    showOpenDialog: async (options) => {
        return new Promise((resolve) => {
            // Create temporary file input
            const input = document.createElement('input');
            input.type = 'file';
            // Set attributes based on options
            if (options.properties?.includes('openDirectory')) {
                input.setAttribute('webkitdirectory', '');
            }
            if (options.properties?.includes('multiSelections')) {
                input.setAttribute('multiple', '');
            }
            if (options.filters?.length) {
                const accept = options.filters
                    .flatMap((filter) => filter.extensions.map((ext) => `.${ext}`))
                    .join(',');
                input.accept = accept;
            }
            // Handle file selection
            input.onchange = (event) => {
                const files = event.target.files;
                if (!files || files.length === 0) {
                    resolve({ canceled: true, filePaths: [] });
                    return;
                }
                const filePaths = Array.from(files).map(file => file.name);
                resolve({ canceled: false, filePaths });
            };
            // Handle cancellation
            input.oncancel = () => {
                resolve({ canceled: true, filePaths: [] });
            };
            // Trigger file dialog
            input.click();
        });
    },
    // Show save dialog - uses download in web environment
    showSaveDialog: async (options) => {
        // In web, we'd trigger a download - simplified implementation:
        return new Promise((resolve) => {
            const defaultPath = options.defaultPath || 'download.txt';
            // In a real implementation, you'd show a modal asking for the file name
            // Simulate a successful save
            resolve({ canceled: false, filePath: defaultPath });
        });
    },
    // Show message dialog - uses browser alert/confirm in web environment
    showMessageBox: async (options) => {
        if (options.type === 'question') {
            const result = window.confirm(options.message || 'Confirm?');
            return { response: result ? 0 : 1 };
        }
        else {
            window.alert(options.message || 'Alert');
            return { response: 0 };
        }
    }
};
// System information
exports.system = {
    // Get system info - returns browser info in web environment
    getSystemInfo: async () => {
        return {
            platform: 'web',
            arch: navigator.platform || 'unknown',
            version: navigator.userAgent || 'unknown',
            memory: {
                total: 0, // Can't reliably get memory info in browsers
                free: 0
            }
        };
    },
    // Check if online
    isOnline: async () => {
        return navigator.onLine;
    },
    // Get app version
    getVersion: async () => {
        return 'web-version';
    }
};
// Clipboard operations
exports.clipboard = {
    // Write text to clipboard
    writeText: async (text) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        }
        else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    },
    // Read text from clipboard
    readText: async () => {
        if (navigator.clipboard && navigator.clipboard.readText) {
            return await navigator.clipboard.readText();
        }
        // No good fallback for reading clipboard in older browsers
        return '';
    }
};
// IPC Renderer operations
exports.ipcRenderer = {
    // Send an event to the main process
    send: async () => {
        return Promise.resolve();
    },
    // Receive an event from the main process
    on: async () => {
        return Promise.resolve();
    },
    // Invoke a method on the main process
    invoke: async () => {
        return Promise.resolve();
    },
    // Remove a listener from the main process
    removeListener: async () => {
        return Promise.resolve();
    }
};
// Create a complete mock Electron API
function createMockElectronAPI() {
    return {
        app: {
            getVersion: () => Promise.resolve('1.0.0-web'),
            getPath: () => Promise.resolve(''),
            quit: () => Promise.resolve(),
            minimize: () => Promise.resolve(),
            maximize: () => Promise.resolve(),
        },
        system: {
            getSystemInfo: () => Promise.resolve({
                platform: 'web',
                arch: 'web',
                version: 'web',
                memory: {
                    total: 0,
                    free: 0,
                },
            }),
            isOnline: () => Promise.resolve(navigator.onLine),
        },
        storage: {
            getUserData: () => Promise.resolve({}),
            setUserData: (data) => { localStorage.setItem("user-data", JSON.stringify(data)); return Promise.resolve(); },
            getMessages: () => Promise.resolve([]),
            saveMessage: (message) => { localStorage.setItem(`message-${message.id}`, JSON.stringify(message)); return Promise.resolve(); },
            deleteMessage: (id) => { localStorage.removeItem(`message-${id}`); return Promise.resolve(); },
        },
        ipcRenderer: exports.ipcRenderer,
        fs: exports.fileSystem,
        dialog: exports.dialog,
        clipboard: exports.clipboard
    };
}
// Install mock Electron API if needed
function installMockElectronAPI() {
    if (typeof window !== 'undefined' && !window.electron && import.meta.env.VITE_WEB_ONLY === 'true') {
        const mockAPI = createMockElectronAPI();
        window.electron = mockAPI;
        console.log('Installed mock Electron API for web environment');
    }
}
