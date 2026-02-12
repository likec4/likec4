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
import { indent, parseStack } from './utils'

function gerErrorFromLogRecord(record: LogRecord): Error | null {
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
        const msg = typeof err === 'string'
          ? err
          : err !== null && typeof err === 'object'
          ? (() => {
            try {
              return JSON.stringify(err)
            } catch {
              return '[unserializable value]'
            }
          })()
          : String(err)
        return [new Error(msg)]
      }
      return []
    })
  if (errors.length === 0) {
    return null
  }
  return errors.length === 1 ? errors[0]! : new AggregateError(errors)
}

export function errorFromLogRecord(record: LogRecord): Error | null {
  const error = gerErrorFromLogRecord(record)
  if (error && typeof record.rawMessage === 'string') {
    return wrapErrorMessage(error, record.rawMessage + '\n')
  }
  return error
}

export function appendErrorToMessage(values: FormattedValues, color = false): FormattedValues {
  const error = gerErrorFromLogRecord(values.record)
  if (error) {
    let errorMessge = error.message
    if (error.stack) {
      errorMessge = errorMessge + '\n' + indent(error.stack.split('\n').slice(1))
    }
    if (color) {
      errorMessge = `${ansiColors.red}${errorMessge}${RESET}`
    }
    return {
      ...values,
      message: values.message + '\n' + indent(errorMessge),
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

export function getMessageOnlyFormatter(): TextFormatter {
  return getTextFormatter({
    format: ({ message }): string => {
      return message
    },
  })
}

const level = (l: LogLevel): string => levelAbbreviations[l]

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
