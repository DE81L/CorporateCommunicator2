import pino from "pino";
export const logger = pino({
    level: process.env.LOG_LEVEL ?? "info",
    transport: {
        target: "pino-pretty",
        options: { colorize: true }
    }
});
export function logCall(fn, name = fn.name || "anonymous") {
    return (function (...args) {
        logger.debug({ args }, `► ${name}`);
        try {
            const r = fn.apply(this, args);
            if (r instanceof Promise) {
                return r.then((data) => {
                    logger.debug({ result: data }, `✔ ${name}`);
                    return data;
                });
            }
            logger.debug({ result: r }, `✔ ${name}`);
            return r;
        }
        catch (err) {
            logger.error({ err }, `✖ ${name}`);
            throw err;
        }
    });
}
