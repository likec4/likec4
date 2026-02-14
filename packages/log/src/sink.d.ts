import { type ConsoleSinkOptions, type Sink } from '@logtape/logtape';
/**
 * Create a sink that writes formatted log records to stdout (default formatter).
 * @param options - Optional console sink options (e.g. custom formatter)
 * @returns Sink that writes to stdout
 */
export declare function getConsoleSink(options?: ConsoleSinkOptions): Sink;
/**
 * Creates a console sink that writes to stderr.
 * (MCP protocol requires stderr to be used for logging)
 * @param options - Optional console sink options (e.g. custom formatter)
 * @returns Sink that writes to stderr
 */
export declare function getConsoleStderrSink(options?: ConsoleSinkOptions): Sink;
