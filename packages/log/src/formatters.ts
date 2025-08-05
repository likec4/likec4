import {
  type AnsiColorFormatterOptions,
  type ConsoleSinkOptions,
  type FormattedValues,
  type LogLevel,
  type LogRecord,
  type Sink,
  type TextFormatter,
  type TextFormatterOptions,
  getAnsiColorFormatter as getLogtapeAnsiColorFormatter,
  getConsoleSink as getLogtapeConsoleSink,
  getTextFormatter as getLogtapeTextFormatter,
} from '@logtape/logtape'
import mergeErrorCause from 'merge-error-cause'
import wrapErrorMessage from 'wrap-error-message'
import { ident, parseStack } from './utils'

function gerErrorFromLogRecord(record: LogRecord): Error | null {
  const errors = Object
    .values(record.properties)
    .filter((v) => v instanceof Error)
    .map(err => {
      const mergedErr = mergeErrorCause(err)
      if (mergedErr.stack) {
        mergedErr.stack = parseStack(mergedErr.stack).join('\n')
      }
      return mergedErr
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

export function appendErrorToMessage(values: FormattedValues, color?: boolean): FormattedValues {
  const error = gerErrorFromLogRecord(values.record)
  if (error) {
    let errorMessge = error.message
    if (error.stack) {
      errorMessge = errorMessge + '\n' + ident(error.stack.split('\n').slice(1))
    }
    if (color) {
      errorMessge = `${ansiColors.red}${errorMessge}${RESET}`
    }
    return {
      ...values,
      message: values.message + '\n' + ident(errorMessge),
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

export function getConsoleSink(options?: ConsoleSinkOptions): Sink {
  return getLogtapeConsoleSink({
    formatter: getAnsiColorFormatter(),
    ...options,
  })
}
