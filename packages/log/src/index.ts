import {
  type Config,
  configureSync as configureLogtape,
  getLogger,
} from '@logtape/logtape'
import { getConsoleSink } from './formatters'

export type {
  Filter,
  Logger,
  LogLevel,
  LogRecord,
  Sink,
  TextFormatter,
} from '@logtape/logtape'

export {
  errorFromLogRecord,
  // formatProperties,
  // formatRecord,
  getAnsiColorFormatter,
  getConsoleSink,
  getConsoleStderrSink,
  getMessageOnlyFormatter,
  getTextFormatter,
} from './formatters'

export { withFilter } from '@logtape/logtape'

export const logger = getLogger('likec4')

export {
  logger as consola,
  logger as rootLogger,
}

export { loggable } from './utils'

/**
 * Get a child logger with the given subcategory.
 *
 * @param subcategory The subcategory.
 * @returns The child logger.
 */
export function createLogger(subcategory: string | readonly [string] | readonly [string, ...string[]]) {
  return logger.getChild(subcategory)
}

export function configureLogger<TSinkId extends string, TFilterId extends string>(
  config?: Partial<Config<TSinkId, TFilterId>>,
) {
  try {
    const sinks = config?.sinks ?? {}
    configureLogtape<any, any>({
      reset: true,
      ...config,
      sinks: {
        console: getConsoleSink(),
        ...sinks,
      },
      loggers: [
        { category: ['logtape', 'meta'], sinks: ['console'], lowestLevel: 'warning' },
        ...(config?.loggers ?? [
          {
            category: 'likec4',
            sinks: ['console'],
            lowestLevel: 'debug',
          },
        ]),
      ],
    })
  } catch (e) {
    console.error(e)
  }
}
