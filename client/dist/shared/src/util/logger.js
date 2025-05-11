import { Logger } from 'tslog';
const settings = {
    minLevel: 'info',
};
export const logger = new Logger(settings);
export function wrap(fn) {
    return async (...args) => {
        return fn(...args);
    };
}
