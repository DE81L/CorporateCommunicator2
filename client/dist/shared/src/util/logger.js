import { Logger } from 'tslog';
const settings = {
    minLevel: 3,
};
export const logger = new Logger(settings);
export function wrap(fn) {
    return async (...args) => {
        return fn(...args);
    };
}
