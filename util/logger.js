export const log = (...args) => {
    if (process.env.LOG_LEVEL === 'debug') {
        console.log('[DEBUG]', ...args);
    }
};
