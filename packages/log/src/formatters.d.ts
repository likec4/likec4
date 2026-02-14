import { type AnsiColorFormatterOptions, type ConsoleFormatter, type FormattedValues, type LogRecord, type TextFormatter, type TextFormatterOptions } from '@logtape/logtape';
/**
 * Extract a single Error from a log record (from properties or rawMessage).
 * @param record - Log record that may contain error in properties or rawMessage
 * @returns Merged/wrapped Error or null if none found
 */
export declare function errorFromLogRecord(record: LogRecord): Error | null;
/**
 * Append error from record properties to the formatted message (optionally colored).
 * @param values - Formatted values (record + message)
 * @param color - When true, wrap error text in ANSI red
 * @returns Updated FormattedValues with error appended to message
 */
export declare function appendErrorToMessage(values: FormattedValues, color?: boolean): FormattedValues;
/**
 * Formatter that outputs only the log message (no timestamp/level/category).
 * @returns TextFormatter that returns just the message string
 */
export declare function getMessageOnlyFormatter(): TextFormatter;
/**
 * Build a text formatter with optional custom format; appends error from record.
 * @param options - Optional format and logtape options
 * @returns TextFormatter
 */
export declare function getTextFormatter(options?: TextFormatterOptions): TextFormatter;
/**
 * Build an ANSI-colored text formatter (level/category colors); appends error in red.
 * @param options - Optional format and logtape ANSI options
 * @returns TextFormatter with ANSI colors
 */
export declare function getAnsiColorFormatter(options?: AnsiColorFormatterOptions): TextFormatter;
/**
 * The formatter returns an array where:
 * - First element is the formatted message string
 * - Second element is the record properties object
 * @param options - Optional messageFormatter (TextFormatter)
 * @returns ConsoleFormatter for console.log/error
 */
export declare function getConsoleFormatter(options?: {
    messageFormatter?: TextFormatter;
}): ConsoleFormatter;
