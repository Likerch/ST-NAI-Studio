export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const PREFIX = '[NAI Studio]';

let threshold: LogLevel = 'info';

export function setLogLevel(level: LogLevel): void {
    threshold = level;
}

function enabled(level: LogLevel): boolean {
    return ORDER[level] >= ORDER[threshold];
}

/** Console logger with a fixed prefix. The NovelAI token never reaches the client, so it cannot leak here. */
export const log = {
    debug: (...args: unknown[]): void => {
        if (enabled('debug')) console.debug(PREFIX, ...args);
    },
    info: (...args: unknown[]): void => {
        if (enabled('info')) console.info(PREFIX, ...args);
    },
    warn: (...args: unknown[]): void => {
        if (enabled('warn')) console.warn(PREFIX, ...args);
    },
    error: (...args: unknown[]): void => {
        if (enabled('error')) console.error(PREFIX, ...args);
    },
};
