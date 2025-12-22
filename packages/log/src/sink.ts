import {
  type ConsoleSinkOptions,
  type LogRecord,
  type Sink,
  getConsoleSink as getLogtapeConsoleSink,
} from '@logtape/logtape'
import { getConsoleFormatter } from './formatters'

export function getConsoleSink(options?: ConsoleSinkOptions): Sink {
  return getLogtapeConsoleSink({
    formatter: getConsoleFormatter(),
    ...options,
  })
}

/**
 * Creates a console sink that writes to stderr.
 * (MCP protocol requires stderr to be used for logging)
 */
export function getConsoleStderrSink(options?: ConsoleSinkOptions): Sink {
  const formatter = options?.formatter ?? getConsoleFormatter()
  return (record: LogRecord) => {
    const args = formatter(record)
    if (typeof args === 'string') {
      const msg = args.replace(/\r?\n$/, '')
      console.error(msg)
    } else {
      console.error(...args)
    }
  }
}
