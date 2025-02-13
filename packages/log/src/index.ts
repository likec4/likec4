import {
  type Config,
  configure as configureLogtape,
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
  getMessageOnlyFormatter,
  getTextFormatter,
} from './formatters'

export {
  withFilter,
} from '@logtape/logtape'

export {
  logger as consola,
  logger as rootLogger,
}

export {
  loggable,
} from './utils'

export const logger = getLogger('likec4')

/**
 * Get a child logger with the given subcategory.
 *
 * @param subcategory The subcategory.
 * @returns The child logger.
 */
export function createLogger(subcategory: string | readonly [string] | readonly [string, ...string[]]) {
  return logger.getChild(subcategory)
}

let configureWasCalled = false

export async function configureLogger<TSinkId extends string, TFilterId extends string>(
  config?: Config<TSinkId, TFilterId>,
) {
  try {
    configureWasCalled = true
    const sinks = config?.sinks ?? {}
    await configureLogtape<any, any>({
      ...config,
      sinks: {
        ...sinks,
        // @ts-expect-error console is not a valid sink id
        console: sinks['console'] ?? getConsoleSink(),
      },
      loggers: [
        { category: ['logtape', 'meta'], sinks: ['console' as any], lowestLevel: 'warning' },
        ...(config?.loggers ?? [
          {
            category: 'likec4',
            sinks: ['console' as any],
            lowestLevel: 'debug',
          },
        ]),
      ],
    })
  } catch (e) {
    console.error(e)
  }
}

export function ensureLoggerIsConfigured() {
  if (!configureWasCalled) {
    configureLogger()
    console.warn('logger automatically configured with default settings')
  }
}
