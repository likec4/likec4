import {
  type AnsiColorFormatterOptions,
  type ConsoleFormatter,
  type FormattedValues,
  type LogLevel,
  type LogRecord,
  type TextFormatter,
  type TextFormatterOptions,
  getAnsiColorFormatter as getLogtapeAnsiColorFormatter,
  getTextFormatter as getLogtapeTextFormatter,
} from '@logtape/logtape'
import mergeErrorCause from 'merge-error-cause'
import wrapErrorMessage from 'wrap-error-message'
import { indent, loggable, parseStack } from './utils'

function getErrorFromLogRecord(record: LogRecord): Error | null {
  const errors = Object
    .entries(record.properties)
    .flatMap(([k, err]) => {
      if (err instanceof Error) {
        const mergedErr = mergeErrorCause(err)
        if (mergedErr.stack) {
          mergedErr.stack = parseStack(mergedErr.stack).join('\n')
        }
        return [mergedErr]
      }
      if (k === 'error' || k === 'err') {
        return [new Error(loggable(err))]
      }
      return []
    })
  if (errors.length === 0) {
    return null
  }
  return errors.length === 1 ? errors[0]! : new AggregateError(errors)
}

/**
 * Extract a single Error from a log record (from properties or rawMessage).
 * @param record - Log record that may contain error in properties or rawMessage
 * @returns Merged/wrapped Error or null if none found
 */
export function errorFromLogRecord(record: LogRecord): Error | null {
  const error = getErrorFromLogRecord(record)
  if (error && typeof record.rawMessage === 'string') {
    return wrapErrorMessage(error, record.rawMessage + '\n')
  }
  return error
}

/**
 * Append error from record properties to the formatted message (optionally colored).
 * @param values - Formatted values (record + message)
 * @param color - When true, wrap error text in ANSI red
 * @returns Updated FormattedValues with error appended to message
 */
export function appendErrorToMessage(values: FormattedValues, color = false): FormattedValues {
  const error = getErrorFromLogRecord(values.record)
  if (error) {
    let errorMessage = error.message
    if (error.stack) {
      errorMessage = errorMessage + '\n' + indent(error.stack.split('\n').slice(1))
    }
    if (color) {
      errorMessage = `${ansiColors.red}${errorMessage}${RESET}`
    }
    return {
      ...values,
      message: values.message + '\n' + indent(errorMessage),
    }
  }
  return values
}

const levelAbbreviations: Record<LogLevel, string> = {
  'trace': 'TRACE',
  'debug': 'DEBUG',
  'info': 'INFO ',
  'warning': 'WARN ',
  'error': 'ERROR',
  'fatal': 'FATAL',
}

/**
 * Formatter that outputs only the log message (no timestamp/level/category).
 * @returns TextFormatter that returns just the message string
 */
export function getMessageOnlyFormatter(): TextFormatter {
  return getTextFormatter({
    format: ({ message }): string => {
      return message
    },
  })
}

const level = (l: LogLevel): string => levelAbbreviations[l]

/**
 * Build a text formatter with optional custom format; appends error from record.
 * @param options - Optional format and logtape options
 * @returns TextFormatter
 */
export function getTextFormatter(options?: TextFormatterOptions): TextFormatter {
  const _format = options?.format ?? (({ timestamp, level, category, message }: FormattedValues): string => {
    return `${timestamp} ${level} ${category} ${message}`
  })
  // const format = options?.format
  return getLogtapeTextFormatter({
    timestamp: 'time',
    level,
    category: '.',
    ...options,
    format: (values) => {
      return _format(appendErrorToMessage(values))
    },
  })
}

const RESET = '\x1b[0m'

const ansiColors = {
  // black: "\x1b[30m",
  red: '\x1b[31m',
  // green: "\x1b[32m",
  // yellow: "\x1b[33m",
  // blue: "\x1b[34m",
  // magenta: "\x1b[35m",
  // cyan: "\x1b[36m",
  // white: "\x1b[37m",
} as const

/**
 * Build an ANSI-colored text formatter (level/category colors); appends error in red.
 * @param options - Optional format and logtape ANSI options
 * @returns TextFormatter with ANSI colors
 */
export function getAnsiColorFormatter(options?: AnsiColorFormatterOptions): TextFormatter {
  const _format = options?.format ?? (({ timestamp, level, category, message }: FormattedValues): string => {
    return `${timestamp} ${level} ${category} ${message}`
  })
  return getLogtapeAnsiColorFormatter({
    timestamp: 'time',
    level,
    categoryStyle: 'bold',
    categoryColor: 'cyan',
    category: '.',
    ...options,
    format: (values) => {
      return _format(appendErrorToMessage(values, true))
    },
  })
}

/**
 * The formatter returns an array where:
 * - First element is the formatted message string
 * - Second element is the record properties object
 * @param options - Optional messageFormatter (TextFormatter)
 * @returns ConsoleFormatter for console.log/error
 */
export function getConsoleFormatter(options?: {
  messageFormatter?: TextFormatter
}): ConsoleFormatter {
  const formatter = options?.messageFormatter
  if (formatter) {
    return (record: LogRecord) => {
      const { properties } = record
      if (properties && Object.keys(properties).length > 0) {
        return [
          formatter(record),
          properties,
        ]
      }
      return [formatter(record)]
    }
  }

  return (record: LogRecord) => {
    const { message, properties } = record
    if (properties && Object.keys(properties).length > 0) {
      return [
        ...message,
        properties,
      ]
    }
    return message
  }
}
