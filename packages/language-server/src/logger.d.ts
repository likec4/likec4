import { type Logger, type Sink, type TextFormatter } from '@likec4/log';
import type { Connection } from 'vscode-languageserver';
export declare const logger: Logger;
export { logger as serverLogger, };
export declare function logError(err: unknown): void;
/**
 * Logs an error as warning (not critical)
 */
export declare function logWarnError(err: unknown): void;
type LspConnectionSinkProps = {
    /**
     * The text formatter to use.  Defaults to {@link defaultTextFormatter}.
     */
    formatter?: TextFormatter;
};
export declare function getLspConnectionSink(connection: Connection, props?: LspConnectionSinkProps): Sink;
export declare function getTelemetrySink(connection: Connection): Sink;
