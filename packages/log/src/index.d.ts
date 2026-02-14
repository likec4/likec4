import { type Config } from '@logtape/logtape';
export type { Filter, Logger, LogLevel, LogRecord, Sink, TextFormatter, } from '@logtape/logtape';
export { errorFromLogRecord, getAnsiColorFormatter, getConsoleFormatter, getMessageOnlyFormatter, getTextFormatter, } from './formatters';
export { getConsoleSink, getConsoleStderrSink, } from './sink';
export { withFilter } from '@logtape/logtape';
export declare const logger: import("@logtape/logtape").Logger;
export { logger as consola, logger as rootLogger, };
export { loggable, wrapError, } from './utils';
/**
 * Get a child logger with the given subcategory.
 *
 * @param subcategory The subcategory.
 * @returns The child logger.
 */
export declare function createLogger(subcategory: string | readonly [string] | readonly [string, ...string[]]): import("@logtape/logtape").Logger;
/**
 * Configure the global logger: sinks, loggers, and lowest level per category.
 * @param config - Optional partial config (sinks, loggers). Merged with defaults.
 */
export declare function configureLogger<TSinkId extends string, TFilterId extends string>(config?: Partial<Config<TSinkId, TFilterId>>): void;
